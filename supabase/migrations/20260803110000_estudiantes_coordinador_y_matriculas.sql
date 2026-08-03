-- RF02, RF03 y RF17: rol estudiante, coordinador único y matrícula validada.
alter type public.rol_usuario add value if not exists 'estudiante';

create table if not exists public.estudiantes (
  id uuid primary key references public.perfiles(id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table if not exists public.matriculas_estudiante (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  periodo_id uuid not null references public.periodos(id) on delete cascade,
  materia_id uuid not null references public.materias(id),
  grupo_id uuid not null references public.grupos(id),
  motivo text not null default 'regular' check (motivo in ('regular','arrastre','repeticion','convalidacion')),
  creado_en timestamptz not null default now(),
  unique (estudiante_id, periodo_id, materia_id)
);

-- No se modifica el histórico de coordinadores existente. Desde esta migración
-- se bloquea la creación o reactivación de coordinadores adicionales.
create or replace function public.validar_coordinador_unico()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rol = 'coordinador' and new.activo
     and (tg_op = 'INSERT' or old.rol <> 'coordinador' or not old.activo)
     and exists (select 1 from public.perfiles where rol = 'coordinador' and activo and id <> new.id) then
    raise exception 'Ya existe un coordinador académico activo. Desactívalo o cambia su rol antes de asignar otro.' using errcode = '23505';
  end if;
  return new;
end;
$$;
drop trigger if exists validar_coordinador_unico on public.perfiles;
create trigger validar_coordinador_unico before insert or update of rol, activo on public.perfiles
for each row execute function public.validar_coordinador_unico();

create or replace function public.crear_estudiante_si_corresponde()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rol = 'estudiante' then
    insert into public.estudiantes(id) values (new.id) on conflict do nothing;
  elsif tg_op = 'UPDATE' and old.rol = 'estudiante' then
    delete from public.estudiantes where id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists crear_estudiante_perfil on public.perfiles;
create trigger crear_estudiante_perfil after insert or update of rol on public.perfiles
for each row execute function public.crear_estudiante_si_corresponde();

create or replace function public.validar_matricula_sin_solapamiento()
returns trigger language plpgsql security definer set search_path = public as $$
declare conflicto text;
begin
  select format('Existe un choque entre %s (%s) y la materia que intentas asignar.', m.nombre, g.nombre)
  into conflicto
  from public.matriculas_estudiante actual
  join public.sesiones existente on existente.grupo_id = actual.grupo_id
  join public.horarios he on he.id = existente.horario_id and he.periodo_id = new.periodo_id and he.estado = 'publicado'
  join public.sesiones candidata on candidata.grupo_id = new.grupo_id and candidata.materia_id = new.materia_id
  join public.horarios hc on hc.id = candidata.horario_id and hc.periodo_id = new.periodo_id and hc.estado = 'publicado'
  join public.materias m on m.id = actual.materia_id
  join public.grupos g on g.id = actual.grupo_id
  where actual.estudiante_id = new.estudiante_id
    and actual.periodo_id = new.periodo_id
    and actual.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and existente.dia_semana = candidata.dia_semana
    and existente.hora_inicio < candidata.hora_fin
    and candidata.hora_inicio < existente.hora_fin
  limit 1;
  if conflicto is not null then raise exception '%', conflicto using errcode = '23P01'; end if;
  return new;
end;
$$;
drop trigger if exists validar_matricula_sin_solapamiento on public.matriculas_estudiante;
create trigger validar_matricula_sin_solapamiento before insert or update on public.matriculas_estudiante
for each row execute function public.validar_matricula_sin_solapamiento();

alter table public.estudiantes enable row level security;
alter table public.matriculas_estudiante enable row level security;
create policy "Estudiante lee su registro" on public.estudiantes for select using (id = auth.uid() or public.auth_rol() in ('coordinador','administrador'));
create policy "Gestion estudiantes" on public.estudiantes for all using (public.auth_rol() in ('coordinador','administrador'));
create policy "Estudiante lee sus matriculas" on public.matriculas_estudiante for select using (estudiante_id = auth.uid() or public.auth_rol() in ('coordinador','administrador'));
create policy "Gestion matriculas" on public.matriculas_estudiante for all using (public.auth_rol() in ('coordinador','administrador'));
