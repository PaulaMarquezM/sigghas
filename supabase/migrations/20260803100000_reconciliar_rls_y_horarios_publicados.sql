-- Reconciliación posterior a un historial remoto incompleto.
-- Es idempotente y completa únicamente las garantías de SIGGHAS que faltaban
-- en el esquema remoto: RLS, auditoría y edición de sesiones publicadas.

alter table public.sedes enable row level security;

drop policy if exists "Insertar historial" on public.historial_cambios;
create policy "Insertar historial" on public.historial_cambios
  for insert
  with check (usuario_id = auth.uid());

drop policy if exists "Coordinador administra periodos" on public.periodos;
create policy "Coordinador administra periodos" on public.periodos
  for all
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra horarios" on public.horarios;
create policy "Coordinador administra horarios" on public.horarios
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra sesiones" on public.sesiones;
create policy "Coordinador administra sesiones" on public.sesiones
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra sesiones compartidas" on public.sesiones_grupos_compartidos;
create policy "Coordinador administra sesiones compartidas" on public.sesiones_grupos_compartidos
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra asignaciones docentes" on public.asignaciones_docente_periodo;
create policy "Coordinador administra asignaciones docentes" on public.asignaciones_docente_periodo
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra disponibilidad espacios" on public.disponibilidad_espacio;
create policy "Coordinador administra disponibilidad espacios" on public.disponibilidad_espacio
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

create or replace function public.impedir_mutacion_horario_publicado()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'horarios' and old.estado = 'publicado'
    and (tg_op = 'DELETE' or new.estado is distinct from old.estado) then
    raise exception 'Un horario publicado no puede eliminarse ni cambiar de estado';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists proteger_horario_publicado on public.horarios;
create trigger proteger_horario_publicado before update or delete on public.horarios
for each row execute function public.impedir_mutacion_horario_publicado();

-- Las sesiones y grupos compartidos permanecen editables después de publicar;
-- las validaciones de la aplicación y las exclusiones anti-solapamiento siguen vigentes.
drop trigger if exists proteger_sesiones_publicadas on public.sesiones;
drop trigger if exists proteger_grupos_compartidos_publicados on public.sesiones_grupos_compartidos;
