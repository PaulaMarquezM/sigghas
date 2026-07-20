-- Generador de horarios: configuración por período, franjas de espacios y guardado atómico.

alter table materias
  alter column horas_semana type numeric(3,1) using horas_semana::numeric,
  alter column horas_teoria type numeric(3,1) using horas_teoria::numeric,
  alter column horas_practica type numeric(3,1) using horas_practica::numeric;

alter table materias
  drop constraint if exists chk_materias_horas_validas,
  add constraint chk_materias_horas_validas check (
    horas_semana > 0
    and horas_semana <= 6
    and mod(horas_semana * 2, 1) = 0
    and horas_teoria >= 0
    and horas_practica >= 0
    and horas_teoria + horas_practica = horas_semana
  ),
  drop constraint if exists chk_materia_modalidad_laboratorio,
  add constraint chk_materia_modalidad_laboratorio check (
    modalidad = 'presencial' or not requiere_laboratorio
  );

alter table sesiones drop constraint if exists chk_espacio_modalidad;
alter table sesiones add constraint chk_espacio_modalidad check (
  (modalidad = 'presencial' and espacio_id is not null)
  or (modalidad in ('virtual', 'hibrida') and espacio_id is null)
);

create table asignaciones_docente_periodo (
  periodo_id uuid not null references periodos(id) on delete cascade,
  materia_id uuid not null references materias(id) on delete cascade,
  grupo_id uuid not null references grupos(id) on delete cascade,
  docente_id uuid not null references docentes(id),
  creado_en timestamptz not null default now(),
  primary key (periodo_id, materia_id, grupo_id)
);

create index idx_asignacion_docente_periodo_docente
  on asignaciones_docente_periodo (periodo_id, docente_id);

create table disponibilidad_espacio (
  id uuid primary key default extensions.uuid_generate_v4(),
  espacio_id uuid not null references espacios(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 1 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  disponible boolean not null default true,
  constraint chk_disponibilidad_espacio_hora check (
    hora_inicio < hora_fin
    and extract(minute from hora_inicio) in (0, 30)
    and extract(minute from hora_fin) in (0, 30)
  )
);

create index idx_disponibilidad_espacio_busqueda
  on disponibilidad_espacio (espacio_id, dia_semana, hora_inicio, hora_fin);

alter table asignaciones_docente_periodo enable row level security;
alter table disponibilidad_espacio enable row level security;

create policy "Lectura autenticada asignaciones docentes"
  on asignaciones_docente_periodo for select to authenticated using (true);
create policy "Coordinador administra asignaciones docentes"
  on asignaciones_docente_periodo for all to authenticated
  using (auth_rol() = 'coordinador') with check (auth_rol() = 'coordinador');
create policy "Lectura autenticada disponibilidad espacios"
  on disponibilidad_espacio for select to authenticated using (true);
create policy "Coordinador administra disponibilidad espacios"
  on disponibilidad_espacio for all to authenticated
  using (auth_rol() = 'coordinador') with check (auth_rol() = 'coordinador');

drop policy if exists "Coordinador escribe horarios" on horarios;
drop policy if exists "Coordinador escribe sesiones" on sesiones;
drop policy if exists "Coordinador administra sesiones compartidas" on sesiones_grupos_compartidos;
create policy "Coordinador administra horarios"
  on horarios for all to authenticated
  using (auth_rol() = 'coordinador') with check (auth_rol() = 'coordinador');
create policy "Coordinador administra sesiones"
  on sesiones for all to authenticated
  using (auth_rol() = 'coordinador') with check (auth_rol() = 'coordinador');
create policy "Coordinador administra sesiones compartidas"
  on sesiones_grupos_compartidos for all to authenticated
  using (auth_rol() = 'coordinador') with check (auth_rol() = 'coordinador');

create or replace function impedir_mutacion_horario_publicado()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'horarios' and old.estado = 'publicado' and new.estado is distinct from old.estado then
    raise exception 'Un horario publicado es inmutable';
  end if;
  if tg_table_name = 'sesiones' and exists (select 1 from horarios where id = old.horario_id and estado = 'publicado') then
    raise exception 'No se pueden modificar sesiones de un horario publicado';
  end if;
  if tg_table_name = 'sesiones_grupos_compartidos' and exists (
    select 1 from sesiones join horarios on horarios.id = sesiones.horario_id
    where sesiones.id = old.sesion_id and horarios.estado = 'publicado'
  ) then
    raise exception 'No se pueden modificar grupos de una sesión publicada';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists proteger_horario_publicado on horarios;
create trigger proteger_horario_publicado before update on horarios
for each row execute function impedir_mutacion_horario_publicado();
drop trigger if exists proteger_sesiones_publicadas on sesiones;
create trigger proteger_sesiones_publicadas before update or delete on sesiones
for each row execute function impedir_mutacion_horario_publicado();
drop trigger if exists proteger_grupos_compartidos_publicados on sesiones_grupos_compartidos;
create trigger proteger_grupos_compartidos_publicados before update or delete on sesiones_grupos_compartidos
for each row execute function impedir_mutacion_horario_publicado();

-- Inserta el resultado completo o no cambia nada. El JSON usa UUID generados
-- por la aplicación para poder enlazar los grupos de una sesión compartida.
create or replace function guardar_horario_generado(
  p_periodo_id uuid,
  p_sesiones jsonb,
  p_reemplazar_borrador_id uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_horario_id uuid;
begin
  if auth_rol() <> 'coordinador' then
    raise exception 'Solo el coordinador puede generar horarios';
  end if;
  if not exists (select 1 from periodos where id = p_periodo_id and activo) then
    raise exception 'El período indicado no está activo';
  end if;
  if jsonb_typeof(p_sesiones) <> 'array' or jsonb_array_length(p_sesiones) = 0 then
    raise exception 'Un horario completo debe contener sesiones';
  end if;

  if p_reemplazar_borrador_id is not null then
    if not exists (
      select 1 from horarios
      where id = p_reemplazar_borrador_id and periodo_id = p_periodo_id and estado = 'borrador'
    ) then
      raise exception 'El borrador seleccionado no puede reemplazarse';
    end if;
  end if;

  insert into horarios (periodo_id, estado, generado_en)
  values (p_periodo_id, 'borrador', now())
  returning id into v_horario_id;

  insert into sesiones (
    id, horario_id, materia_id, docente_id, grupo_id, espacio_id,
    modalidad, dia_semana, hora_inicio, hora_fin, sede_id
  )
  select
    (item->>'id')::uuid, v_horario_id, (item->>'materia_id')::uuid,
    (item->>'docente_id')::uuid, (item->>'grupo_id')::uuid,
    nullif(item->>'espacio_id', '')::uuid, (item->>'modalidad')::modalidad_clase,
    (item->>'dia_semana')::smallint, (item->>'hora_inicio')::time,
    (item->>'hora_fin')::time, (item->>'sede_id')::uuid
  from jsonb_array_elements(p_sesiones) item;

  insert into sesiones_grupos_compartidos (sesion_id, grupo_id)
  select (item->>'id')::uuid, grupo_id::uuid
  from jsonb_array_elements(p_sesiones) item
  cross join lateral jsonb_array_elements_text(coalesce(item->'grupos_compartidos', '[]'::jsonb)) grupo_id;

  if p_reemplazar_borrador_id is not null then
    delete from horarios where id = p_reemplazar_borrador_id;
  end if;

  return v_horario_id;
end;
$$;

revoke all on function guardar_horario_generado(uuid, jsonb, uuid) from public;
grant execute on function guardar_horario_generado(uuid, jsonb, uuid) to authenticated;
