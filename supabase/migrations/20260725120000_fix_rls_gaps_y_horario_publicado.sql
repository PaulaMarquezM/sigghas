-- SIGGHAS — Corrige brechas de RLS y el bypass de DELETE sobre horarios
-- publicados, encontrados en la revisión de seguridad del esquema.

-- ============================================================
-- BUG-001: "sedes" nunca activaba RLS. Su policy de lectura
-- (001_schema_inicial.sql:213) quedaba sin efecto y la tabla era
-- accesible sin ninguna restricción de rol.
-- ============================================================
alter table sedes enable row level security;

-- ============================================================
-- BUG-003: "periodos" solo tenía policy de lectura; no existía
-- forma de crear/editar periodos académicos desde el cliente
-- autenticado.
-- ============================================================
create policy "Coordinador administra periodos" on periodos
  for all
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

-- ============================================================
-- BUG-004: "Insertar historial" solo exigía estar autenticado,
-- sin validar que usuario_id coincidiera con auth.uid() — permitía
-- falsificar la autoría de cualquier entrada de auditoría.
-- ============================================================
drop policy if exists "Insertar historial" on historial_cambios;
create policy "Insertar historial" on historial_cambios
  for insert
  with check (usuario_id = auth.uid());

-- ============================================================
-- BUG-008: el trigger de inmutabilidad de horarios publicados
-- (proteger_horario_publicado, migración 010) solo se disparaba en
-- UPDATE. Un horario publicado se podía borrar directamente con
-- DELETE, arrastrando en cascada sus sesiones e historial.
-- ============================================================
create or replace function impedir_mutacion_horario_publicado()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'horarios' then
    if old.estado = 'publicado' and (tg_op = 'DELETE' or new.estado is distinct from old.estado) then
      raise exception 'Un horario publicado es inmutable';
    end if;
  elsif tg_table_name = 'sesiones' then
    if exists (
      select 1 from horarios
      where id = old.horario_id and estado = 'publicado'
    ) then
      raise exception 'No se pueden modificar sesiones de un horario publicado';
    end if;
  elsif tg_table_name = 'sesiones_grupos_compartidos' then
    if exists (
      select 1
      from sesiones
      join horarios on horarios.id = sesiones.horario_id
      where sesiones.id = old.sesion_id and horarios.estado = 'publicado'
    ) then
      raise exception 'No se pueden modificar grupos de una sesión publicada';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists proteger_horario_publicado on horarios;
create trigger proteger_horario_publicado before update or delete on horarios
for each row execute function impedir_mutacion_horario_publicado();

-- ============================================================
-- BUG-009: la migración 009 dejó la gestión de horarios/sesiones
-- (y, en el mismo cambio, la de asignaciones_docente_periodo y
-- disponibilidad_espacio) exclusiva de 'coordinador', rompiendo el
-- patrón del resto del esquema donde 'administrador' tiene los
-- mismos permisos de escritura (materias, grupos, espacios,
-- disponibilidad_docente, periodos). Se iguala aquí.
-- ============================================================
drop policy if exists "Coordinador administra horarios" on horarios;
create policy "Coordinador administra horarios" on horarios
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra sesiones" on sesiones;
create policy "Coordinador administra sesiones" on sesiones
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra sesiones compartidas" on sesiones_grupos_compartidos;
create policy "Coordinador administra sesiones compartidas" on sesiones_grupos_compartidos
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra asignaciones docentes" on asignaciones_docente_periodo;
create policy "Coordinador administra asignaciones docentes" on asignaciones_docente_periodo
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

drop policy if exists "Coordinador administra disponibilidad espacios" on disponibilidad_espacio;
create policy "Coordinador administra disponibilidad espacios" on disponibilidad_espacio
  for all to authenticated
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

-- guardar_horario_generado() solo dejaba generar horarios al coordinador;
-- se amplía al mismo criterio que las policies de arriba.
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
  if auth_rol() not in ('coordinador', 'administrador') then
    raise exception 'Solo el coordinador o administrador pueden generar horarios';
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
