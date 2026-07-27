-- SIGGHAS — RLS de docentes, constraints anti-solapamiento y endurecimiento
-- del RPC de generación de horarios.

-- ============================================================
-- BUG-002: "docentes" tenía RLS activado (001_schema_inicial.sql)
-- pero ninguna policy. Con RLS activo y cero policies, Postgres
-- deniega todo acceso salvo service_role. Hoy la app funciona
-- porque siempre usa el cliente admin + requireRol() en el
-- servidor, pero el hueco de RLS queda ahí para cualquier otro
-- consumidor (PostgREST directo, futuras features).
-- ============================================================
create policy "Lectura autenticada" on docentes
  for select using (auth.role() = 'authenticated');

create policy "Coordinador administra docentes" on docentes
  for all
  using (auth_rol() in ('coordinador', 'administrador'))
  with check (auth_rol() in ('coordinador', 'administrador'));

-- ============================================================
-- BUG-005: no existía ninguna restricción a nivel de base de datos
-- que impidiera dos sesiones solapadas del mismo docente, grupo o
-- espacio dentro de un mismo horario. Se agregan EXCLUDE
-- constraints (requieren btree_gist para poder combinar columnas
-- de igualdad exacta con un rango de horas vía &&).
--
-- Alcance: el solapamiento se evalúa DENTRO de un mismo horario_id
-- (coincide con el alcance de validarCandidato() en la app: nunca
-- compara contra otros horarios/periodos, que son semanas distintas
-- y no deberían "chocar" entre sí).
--
-- Límite conocido: una sesión compartida entre varios grupos (RN16)
-- solo guarda el grupo "principal" en sesiones.grupo_id — los demás
-- grupos viven en sesiones_grupos_compartidos y no quedan cubiertos
-- por el EXCLUDE de grupo_id. Cerrar ese caso requeriría un trigger
-- aparte sobre sesiones_grupos_compartidos.
--
-- Si este ALTER TABLE falla con "conflicting key value violates
-- exclusion constraint", significa que YA existen sesiones
-- solapadas guardadas en producción — hay que revisarlas antes de
-- poder aplicar esta migración.
-- ============================================================
create extension if not exists btree_gist;

alter table sesiones
  add constraint sesiones_no_solapa_docente
  exclude using gist (
    horario_id with =,
    docente_id with =,
    dia_semana with =,
    int4range(
      (extract(hour from hora_inicio)::int * 60 + extract(minute from hora_inicio)::int),
      (extract(hour from hora_fin)::int * 60 + extract(minute from hora_fin)::int)
    ) with &&
  );

alter table sesiones
  add constraint sesiones_no_solapa_grupo
  exclude using gist (
    horario_id with =,
    grupo_id with =,
    dia_semana with =,
    int4range(
      (extract(hour from hora_inicio)::int * 60 + extract(minute from hora_inicio)::int),
      (extract(hour from hora_fin)::int * 60 + extract(minute from hora_fin)::int)
    ) with &&
  );

alter table sesiones
  add constraint sesiones_no_solapa_espacio
  exclude using gist (
    horario_id with =,
    espacio_id with =,
    dia_semana with =,
    int4range(
      (extract(hour from hora_inicio)::int * 60 + extract(minute from hora_inicio)::int),
      (extract(hour from hora_fin)::int * 60 + extract(minute from hora_fin)::int)
    ) with &&
  )
  where (espacio_id is not null);

-- ============================================================
-- BUG-010: guardar_horario_generado() insertaba las sesiones del
-- JSON del cliente sin revalidar nada en el servidor. Con los
-- EXCLUDE constraints de arriba, un insert con sesiones solapadas
-- ahora falla a nivel de base de datos (siempre atómico: al ser
-- una sola llamada de función, cualquier excepción no capturada
-- revierte también el insert de "horarios" hecho antes) — aquí
-- solo se traduce el error crudo de Postgres a uno legible.
-- ============================================================
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

  begin
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
  exception when exclusion_violation then
    raise exception 'El horario generado contiene sesiones que se solapan en docente, grupo o aula; no se guardó ningún cambio.';
  end;

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
