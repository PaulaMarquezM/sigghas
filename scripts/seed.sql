-- ============================================================
-- SIGGHAS — seed vía SQL Editor del Dashboard de Supabase
-- ============================================================
-- Por qué existe este script (y no basta con `npm run db:seed`):
-- `scripts/seed.mjs` usa `supabase.auth.admin.createUser`, que pasa
-- por GoTrue — y GoTrue está devolviendo 500 "Database error
-- creating new user" en signup/admin.createUser (bug de prod, ver
-- handoff 2026-07-03). Insertar directo en auth.users/auth.identities
-- como rol `postgres` (que es lo que corre el SQL Editor) SÍ
-- funciona — confirmado en la sesión de diagnóstico. Este script
-- replica esa vía para poder seedear y probar la app mientras el
-- bug de signup sigue sin causa raíz identificada.
--
-- Uso: pegar completo en Dashboard → SQL Editor → Run.
-- Idempotente: se puede correr varias veces sin duplicar filas.
-- ============================================================

create extension if not exists pgcrypto;

-- Fix de schema: 002_alinear_fase2_entidades.sql agregó 'hibrida' al
-- enum modalidad_clase pero no actualizó este constraint, así que
-- todo insert con modalidad='hibrida' fallaba. Ver
-- supabase/migrations/004_fix_chk_espacio_modalidad_hibrida.sql
-- (aplicar esa migración vía CLI en algún momento; esto es idempotente
-- así que no rompe si ya se aplicó).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'chk_espacio_modalidad' and conrelid = 'sesiones'::regclass
  ) then
    alter table sesiones drop constraint chk_espacio_modalidad;
  end if;

  -- Normaliza los datos creados con la regla antigua, que reservaba aulas
  -- para sesiones híbridas. No elimina sesiones ni su historial.
  update sesiones
  set espacio_id = null
  where modalidad in ('virtual', 'hibrida')
    and espacio_id is not null;

  alter table sesiones
    add constraint chk_espacio_modalidad check (
      (modalidad = 'presencial' and espacio_id is not null)
      or (modalidad in ('virtual', 'hibrida') and espacio_id is null)
    );
end $$;

-- ------------------------------------------------------------
-- Helper: crea un usuario en auth.users + auth.identities si no
-- existe (mismo efecto que un signup exitoso), dispara el trigger
-- on_auth_user_created -> perfiles automáticamente.
-- ------------------------------------------------------------
create or replace function pg_temp.seed_user(p_email text, p_nombre text, p_rol text, p_password text)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is not null then
    return v_id;
  end if;

  v_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre', p_nombre, 'rol', p_rol),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', p_email),
    'email', now(), now(), now()
  );

  return v_id;
end;
$$;

-- ------------------------------------------------------------
-- sedes: ya existen por 001_schema_inicial.sql (Portoviejo, Manta)
-- no se crean acá, solo se leen.
-- ------------------------------------------------------------
do $$
declare
  v_sede_portoviejo uuid;
  v_sede_manta      uuid;
  v_periodo_id      uuid;
  v_coordinador_id  uuid;
  v_admin_id        uuid;
  v_apoyo_id        uuid;
  v_docente_tc      uuid;
  v_docente_h1      uuid;
  v_docente_h2      uuid;
  v_estudiante1     uuid;
  v_estudiante2     uuid;
  v_horario_borrador uuid;
  v_horario_aprobado uuid;
  v_horario_publicado uuid;
  v_sesion1 uuid;
  v_sesion2 uuid;
  v_sesion_virtual uuid;
  v_password text := 'Sigghas2026!';
begin
  select id into v_sede_portoviejo from sedes where nombre = 'Portoviejo';
  select id into v_sede_manta      from sedes where nombre = 'Manta';

  -- periodo activo
  update periodos set activo = false where activo = true;
  insert into periodos (nombre, fecha_inicio, fecha_fin, activo)
  values ('2026-I', '2026-05-01', '2026-09-15', true)
  on conflict (nombre) do update set activo = true
  returning id into v_periodo_id;

  -- usuarios
  v_coordinador_id := pg_temp.seed_user('coordinador@sigghas.test', 'Coordinador Demo', 'coordinador', v_password);
  v_admin_id       := pg_temp.seed_user('admin@sigghas.test', 'Administrador Demo', 'administrador', v_password);
  v_apoyo_id       := pg_temp.seed_user('apoyo@sigghas.test', 'Apoyo Demo', 'apoyo', v_password);
  v_docente_tc     := pg_temp.seed_user('docente.tc@sigghas.test', 'Docente Tiempo Completo', 'docente', v_password);
  v_docente_h1     := pg_temp.seed_user('docente.horas1@sigghas.test', 'Docente Por Horas Uno', 'docente', v_password);
  v_docente_h2     := pg_temp.seed_user('docente.horas2@sigghas.test', 'Docente Por Horas Dos', 'docente', v_password);
  v_estudiante1    := pg_temp.seed_user('estudiante1@sigghas.test', 'Estudiante Uno', 'estudiante', v_password);
  v_estudiante2    := pg_temp.seed_user('estudiante2@sigghas.test', 'Estudiante Dos', 'estudiante', v_password);

  update perfiles set sede_id = v_sede_portoviejo where id in (v_coordinador_id, v_admin_id, v_apoyo_id, v_docente_tc, v_docente_h1, v_estudiante1);
  update perfiles set sede_id = v_sede_manta      where id in (v_docente_h2, v_estudiante2);

  insert into docentes (id, tipo_contrato, hora_entrada, hora_salida, max_horas_semana, sede_principal_id)
  values
    (v_docente_tc, 'titular',    '08:00', '16:00', 40, v_sede_portoviejo),
    (v_docente_h1, 'contratado', null,    null,    20, v_sede_portoviejo),
    (v_docente_h2, 'honorarios', null,    null,    16, v_sede_manta)
  on conflict (id) do update set
    tipo_contrato = excluded.tipo_contrato,
    hora_entrada = excluded.hora_entrada,
    hora_salida = excluded.hora_salida,
    max_horas_semana = excluded.max_horas_semana,
    sede_principal_id = excluded.sede_principal_id;

  -- disponibilidad
  delete from disponibilidad_docente where docente_id in (v_docente_tc, v_docente_h1, v_docente_h2);
  insert into disponibilidad_docente (docente_id, dia_semana, hora_inicio, hora_fin, es_tiempo_oficina)
  select d.docente_id, d.dia, d.hi, d.hf, d.oficina
  from (values
    (v_docente_tc, 1, '08:00'::time, '12:00'::time, false), (v_docente_tc, 1, '14:00'::time, '16:00'::time, false),
    (v_docente_tc, 2, '08:00'::time, '12:00'::time, false), (v_docente_tc, 2, '14:00'::time, '16:00'::time, false),
    (v_docente_tc, 3, '08:00'::time, '12:00'::time, false), (v_docente_tc, 3, '14:00'::time, '16:00'::time, false),
    (v_docente_tc, 4, '08:00'::time, '12:00'::time, false), (v_docente_tc, 4, '14:00'::time, '16:00'::time, false),
    (v_docente_tc, 5, '08:00'::time, '12:00'::time, false), (v_docente_tc, 5, '14:00'::time, '16:00'::time, true),
    (v_docente_h1, 1, '08:00'::time, '12:00'::time, false), (v_docente_h1, 1, '14:00'::time, '16:00'::time, false),
    (v_docente_h1, 2, '08:00'::time, '12:00'::time, false), (v_docente_h1, 2, '14:00'::time, '16:00'::time, false),
    (v_docente_h1, 3, '08:00'::time, '12:00'::time, false), (v_docente_h1, 3, '14:00'::time, '16:00'::time, false),
    (v_docente_h1, 4, '08:00'::time, '12:00'::time, false), (v_docente_h1, 4, '14:00'::time, '16:00'::time, false),
    (v_docente_h1, 5, '08:00'::time, '12:00'::time, false), (v_docente_h1, 5, '14:00'::time, '16:00'::time, true),
    (v_docente_h2, 1, '08:00'::time, '12:00'::time, false), (v_docente_h2, 1, '14:00'::time, '16:00'::time, false),
    (v_docente_h2, 2, '08:00'::time, '12:00'::time, false), (v_docente_h2, 2, '14:00'::time, '16:00'::time, false),
    (v_docente_h2, 3, '08:00'::time, '12:00'::time, false), (v_docente_h2, 3, '14:00'::time, '16:00'::time, false),
    (v_docente_h2, 4, '08:00'::time, '12:00'::time, false), (v_docente_h2, 4, '14:00'::time, '16:00'::time, false),
    (v_docente_h2, 5, '08:00'::time, '12:00'::time, false), (v_docente_h2, 5, '14:00'::time, '16:00'::time, true)
  ) as d(docente_id, dia, hi, hf, oficina);

  -- materias
  insert into materias (codigo, nombre, semestre, nivel, horas_teoria, horas_practica, horas_semana, requiere_laboratorio, modalidad, activo)
  values
    ('SW101', 'Programación I',            1, 1, 3, 2, 5, true,  'presencial', true),
    ('SW102', 'Bases de Datos',            3, 3, 3, 1, 4, true,  'presencial', true),
    ('SW103', 'Ingeniería de Software',    5, 5, 4, 0, 4, false, 'hibrida',    true),
    ('SW104', 'Redes de Computadoras',     5, 5, 2, 2, 4, true,  'presencial', true),
    ('SW105', 'Inteligencia Artificial',   7, 7, 3, 1, 4, false, 'virtual',    true),
    ('SW106', 'Gestión de Proyectos',      8, 8, 3, 0, 3, false, 'hibrida',    false)
  on conflict (codigo) do update set
    nombre = excluded.nombre, semestre = excluded.semestre, nivel = excluded.nivel,
    horas_teoria = excluded.horas_teoria, horas_practica = excluded.horas_practica,
    horas_semana = excluded.horas_semana, requiere_laboratorio = excluded.requiere_laboratorio,
    modalidad = excluded.modalidad, activo = excluded.activo;

  -- purga sesiones/historial de CUALQUIER horario (no solo los que
  -- este script rastrea) que referencien los grupos/espacios que
  -- estamos por recrear — si ya se generó un horario desde la UI,
  -- esas sesiones también apuntan a estos grupos/espacios y bloquean
  -- el delete por FK (sesiones_grupo_id_fkey / sesiones_espacio_id_fkey).
  -- historial_cambios.sesion_id no tiene on delete cascade, así que
  -- también hay que limpiarlo primero.
  delete from historial_cambios
  where sesion_id in (
    select id from sesiones
    where grupo_id in (select id from grupos where nombre in ('SW-1A', 'SW-3A', 'SW-5A', 'SW-5B', 'SW-7A'))
       or espacio_id in (select id from espacios where nombre in ('Aula 101', 'Aula 102', 'Lab-A', 'Auditorio Central', 'Aula 201', 'Lab-B', 'Sala Reuniones 1'))
  );
  delete from sesiones
  where grupo_id in (select id from grupos where nombre in ('SW-1A', 'SW-3A', 'SW-5A', 'SW-5B', 'SW-7A'))
     or espacio_id in (select id from espacios where nombre in ('Aula 101', 'Aula 102', 'Lab-A', 'Auditorio Central', 'Aula 201', 'Lab-B', 'Sala Reuniones 1'));

  -- grupos
  delete from grupos where nombre in ('SW-1A', 'SW-3A', 'SW-5A', 'SW-5B', 'SW-7A');
  insert into grupos (nombre, semestre, cantidad_estudiantes, sede_id, requiere_accesibilidad, activo)
  values
    ('SW-1A', 1, 30, v_sede_portoviejo, false, true),
    ('SW-3A', 3, 28, v_sede_portoviejo, true,  true),
    ('SW-5A', 5, 25, v_sede_portoviejo, false, true),
    ('SW-5B', 5, 22, v_sede_manta,      false, true),
    ('SW-7A', 7, 20, v_sede_manta,      false, true);

  -- espacios
  delete from espacios where nombre in ('Aula 101', 'Aula 102', 'Lab-A', 'Auditorio Central', 'Aula 201', 'Lab-B', 'Sala Reuniones 1');
  insert into espacios (nombre, tipo, capacidad, accesible, sede_id, disponible, activo, tiene_proyector, tiene_internet)
  values
    ('Aula 101',          'aula',            35, true,  v_sede_portoviejo, true,  true,  true,  true),
    ('Aula 102',          'aula',            30, false, v_sede_portoviejo, true,  true,  true,  true),
    ('Lab-A',             'laboratorio',     33, true,  v_sede_portoviejo, true,  true,  true,  true),
    ('Auditorio Central', 'auditorio',      120, true,  v_sede_portoviejo, true,  true,  true,  true),
    ('Aula 201',          'aula',            28, false, v_sede_manta,      true,  true,  false, true),
    ('Lab-B',             'laboratorio',     25, false, v_sede_manta,      true,  true,  true,  true),
    ('Sala Reuniones 1',  'sala_reuniones',  10, true,  v_sede_manta,      true,  true,  false, true);

  -- horarios (historial_cambios.horario_id tampoco tiene cascade)
  delete from historial_cambios where horario_id in (select id from horarios where periodo_id = v_periodo_id);
  delete from horarios where periodo_id = v_periodo_id;
  insert into horarios (periodo_id, estado) values (v_periodo_id, 'borrador') returning id into v_horario_borrador;
  insert into horarios (periodo_id, estado, generado_en, aprobado_en, aprobado_por) values (v_periodo_id, 'aprobado', now(), now(), v_coordinador_id) returning id into v_horario_aprobado;
  insert into horarios (periodo_id, estado, generado_en, aprobado_en, aprobado_por) values (v_periodo_id, 'publicado', now(), now(), v_coordinador_id) returning id into v_horario_publicado;

  -- sesiones
  delete from sesiones where horario_id in (v_horario_borrador, v_horario_aprobado, v_horario_publicado);

  insert into sesiones (horario_id, materia_id, docente_id, grupo_id, espacio_id, modalidad, dia_semana, hora_inicio, hora_fin, sede_id)
  select v_horario_publicado, m.id, v_docente_tc, g.id, e.id, 'presencial', 1, '08:00', '10:00', v_sede_portoviejo
  from materias m, grupos g, espacios e
  where m.codigo = 'SW101' and g.nombre = 'SW-1A' and e.nombre = 'Lab-A'
  returning id into v_sesion1;

  insert into sesiones (horario_id, materia_id, docente_id, grupo_id, espacio_id, modalidad, dia_semana, hora_inicio, hora_fin, sede_id)
  select v_horario_publicado, m.id, v_docente_h1, g.id, e.id, 'presencial', 2, '10:00', '12:00', v_sede_portoviejo
  from materias m, grupos g, espacios e
  where m.codigo = 'SW102' and g.nombre = 'SW-3A' and e.nombre = 'Aula 101'
  returning id into v_sesion2;

  insert into sesiones (horario_id, materia_id, docente_id, grupo_id, espacio_id, modalidad, dia_semana, hora_inicio, hora_fin, sede_id)
  select v_horario_publicado, m.id, v_docente_tc, g.id, e.id, 'presencial', 3, '08:00', '10:00', v_sede_portoviejo
  from materias m, grupos g, espacios e
  where m.codigo = 'SW104' and g.nombre = 'SW-5A' and e.nombre = 'Aula 102';

  insert into sesiones (horario_id, materia_id, docente_id, grupo_id, espacio_id, modalidad, dia_semana, hora_inicio, hora_fin, sede_id)
  select v_horario_aprobado, m.id, v_docente_h2, g.id, e.id, 'hibrida', 4, '14:00', '16:00', v_sede_manta
  from materias m, grupos g, espacios e
  where m.codigo = 'SW103' and g.nombre = 'SW-5B' and e.nombre = 'Aula 201';

  insert into sesiones (horario_id, materia_id, docente_id, grupo_id, espacio_id, modalidad, dia_semana, hora_inicio, hora_fin, sede_id)
  select v_horario_aprobado, m.id, v_docente_h2, g.id, null, 'virtual', 5, '08:00', '10:00', v_sede_manta
  from materias m, grupos g
  where m.codigo = 'SW105' and g.nombre = 'SW-7A'
  returning id into v_sesion_virtual;

  insert into sesiones (horario_id, materia_id, docente_id, grupo_id, espacio_id, modalidad, dia_semana, hora_inicio, hora_fin, sede_id)
  select v_horario_borrador, m.id, v_docente_tc, g.id, e.id, 'presencial', 1, '10:00', '12:00', v_sede_portoviejo
  from materias m, grupos g, espacios e
  where m.codigo = 'SW101' and g.nombre = 'SW-1A' and e.nombre = 'Auditorio Central';

  -- sesiones compartidas (virtual, RN21)
  insert into sesiones_grupos_compartidos (sesion_id, grupo_id)
  select v_sesion_virtual, g.id from grupos g where g.nombre in ('SW-7A', 'SW-5B')
  on conflict do nothing;

  -- historial de cambios
  insert into historial_cambios (sesion_id, horario_id, usuario_id, accion, detalle)
  values
    (v_sesion1, v_horario_publicado, v_coordinador_id, 'creacion', jsonb_build_object('nota', 'sesión inicial seed')),
    (v_sesion2, v_horario_aprobado,  v_coordinador_id, 'edicion',  jsonb_build_object('cambio', 'espacio asignado'));

  raise notice 'seed completo. password para todos los usuarios de prueba: %', v_password;
end $$;
