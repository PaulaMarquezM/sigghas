-- ============================================================
-- SIGGHAS — Schema inicial
-- Sistema Inteligente de Generación y Gestión de Horarios
-- Académicos para la Carrera de Software — PUCE
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM tipos
-- ============================================================
create type rol_usuario as enum ('coordinador', 'docente', 'estudiante', 'administrador', 'apoyo');
create type tipo_contrato as enum ('tiempo_completo', 'por_horas');
create type modalidad_clase as enum ('presencial', 'virtual');
create type tipo_espacio as enum ('aula', 'laboratorio');
create type estado_horario as enum ('borrador', 'aprobado', 'publicado');

-- ============================================================
-- SEDES
-- ============================================================
create table sedes (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null unique,        -- 'Portoviejo' | 'Manta'
  es_central  boolean not null default false,
  creado_en   timestamptz not null default now()
);

insert into sedes (nombre, es_central) values
  ('Portoviejo', true),
  ('Manta',      false);

-- ============================================================
-- PERFILES (extiende auth.users de Supabase)
-- ============================================================
create table perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null unique,
  rol         rol_usuario not null default 'estudiante',
  sede_id     uuid references sedes(id),
  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================
-- DOCENTES (info adicional al perfil)
-- ============================================================
create table docentes (
  id              uuid primary key references perfiles(id) on delete cascade,
  tipo_contrato   tipo_contrato not null default 'por_horas',
  hora_entrada    time,           -- solo tiempo_completo
  hora_salida     time,           -- solo tiempo_completo
  max_horas_semana integer not null default 20,
  sede_principal_id uuid references sedes(id)
);

-- ============================================================
-- DISPONIBILIDAD DOCENTE
-- ============================================================
create table disponibilidad_docente (
  id          uuid primary key default uuid_generate_v4(),
  docente_id  uuid not null references docentes(id) on delete cascade,
  dia_semana  smallint not null check (dia_semana between 1 and 6), -- 1=Lunes ... 6=Sábado
  hora_inicio time not null,
  hora_fin    time not null,
  es_tiempo_oficina boolean not null default false, -- bloque reservado (RN07)
  constraint chk_horario check (hora_inicio < hora_fin)
);

-- ============================================================
-- MATERIAS
-- ============================================================
create table materias (
  id                  uuid primary key default uuid_generate_v4(),
  codigo              text not null unique,
  nombre              text not null,
  semestre            smallint not null check (semestre between 1 and 10),
  horas_semana        smallint not null default 2,
  requiere_laboratorio boolean not null default false,
  creado_en           timestamptz not null default now()
);

-- ============================================================
-- GRUPOS ACADÉMICOS
-- ============================================================
create table grupos (
  id                    uuid primary key default uuid_generate_v4(),
  nombre                text not null,          -- 'SW-5A', 'SW-5B'
  semestre              smallint not null,
  cantidad_estudiantes  smallint not null default 0,
  sede_id               uuid not null references sedes(id),
  requiere_accesibilidad boolean not null default false,
  activo                boolean not null default true,
  creado_en             timestamptz not null default now()
);

-- ============================================================
-- AULAS Y LABORATORIOS
-- ============================================================
create table espacios (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,              -- 'Aula 101', 'Lab-A'
  tipo          tipo_espacio not null default 'aula',
  capacidad     smallint not null,
  accesible     boolean not null default false,
  sede_id       uuid not null references sedes(id),
  disponible    boolean not null default true,  -- habilitado/deshabilitado (RN41)
  creado_en     timestamptz not null default now()
);

-- ============================================================
-- PERIODOS ACADÉMICOS
-- ============================================================
create table periodos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null unique,         -- '2026-I', '2026-II'
  fecha_inicio date not null,
  fecha_fin    date not null,
  activo       boolean not null default false,
  creado_en    timestamptz not null default now()
);

-- ============================================================
-- HORARIOS (contenedor principal)
-- ============================================================
create table horarios (
  id          uuid primary key default uuid_generate_v4(),
  periodo_id  uuid not null references periodos(id),
  estado      estado_horario not null default 'borrador',
  generado_en timestamptz,
  aprobado_en timestamptz,
  aprobado_por uuid references perfiles(id),
  creado_en   timestamptz not null default now()
);

-- ============================================================
-- SESIONES (asignaciones individuales dentro de un horario)
-- ============================================================
create table sesiones (
  id            uuid primary key default uuid_generate_v4(),
  horario_id    uuid not null references horarios(id) on delete cascade,
  materia_id    uuid not null references materias(id),
  docente_id    uuid not null references docentes(id),
  grupo_id      uuid not null references grupos(id),
  espacio_id    uuid references espacios(id),  -- null si es virtual (RN19)
  modalidad     modalidad_clase not null default 'presencial',
  dia_semana    smallint not null check (dia_semana between 1 and 6),
  hora_inicio   time not null,
  hora_fin      time not null,
  sede_id       uuid not null references sedes(id),
  creado_en     timestamptz not null default now(),
  constraint chk_sesion_horario check (hora_inicio < hora_fin),
  -- virtual no necesita espacio, presencial sí (RN19)
  constraint chk_espacio_modalidad check (
    (modalidad = 'virtual') or (modalidad = 'presencial' and espacio_id is not null)
  )
);

-- Sesiones virtuales compartidas entre múltiples grupos (RN21)
create table sesiones_grupos_compartidos (
  sesion_id  uuid not null references sesiones(id) on delete cascade,
  grupo_id   uuid not null references grupos(id),
  primary key (sesion_id, grupo_id)
);

-- ============================================================
-- HISTORIAL DE CAMBIOS (RN37 / RS25)
-- ============================================================
create table historial_cambios (
  id            uuid primary key default uuid_generate_v4(),
  sesion_id     uuid references sesiones(id),
  horario_id    uuid references horarios(id),
  usuario_id    uuid not null references perfiles(id),
  accion        text not null,              -- 'creacion' | 'edicion' | 'eliminacion'
  detalle       jsonb,                     -- snapshot del cambio
  creado_en     timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_sesiones_docente       on sesiones(docente_id, dia_semana, hora_inicio);
create index idx_sesiones_grupo         on sesiones(grupo_id, dia_semana, hora_inicio);
create index idx_sesiones_espacio       on sesiones(espacio_id, dia_semana, hora_inicio);
create index idx_sesiones_horario       on sesiones(horario_id);
create index idx_disponibilidad_docente on disponibilidad_docente(docente_id, dia_semana);
create index idx_perfiles_rol           on perfiles(rol);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table perfiles             enable row level security;
alter table docentes             enable row level security;
alter table disponibilidad_docente enable row level security;
alter table materias             enable row level security;
alter table grupos               enable row level security;
alter table espacios             enable row level security;
alter table periodos             enable row level security;
alter table horarios             enable row level security;
alter table sesiones             enable row level security;
alter table sesiones_grupos_compartidos enable row level security;
alter table historial_cambios    enable row level security;

-- Función auxiliar para obtener rol del usuario actual
create or replace function auth_rol()
returns rol_usuario language sql stable as $$
  select rol from perfiles where id = auth.uid()
$$;

-- Políticas: lectura pública autenticada, escritura solo coordinador/admin
create policy "Lectura autenticada" on sedes         for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on periodos      for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on materias      for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on grupos        for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on espacios      for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on horarios      for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on sesiones      for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on sesiones_grupos_compartidos for select using (auth.role() = 'authenticated');
create policy "Lectura autenticada" on disponibilidad_docente for select using (auth.role() = 'authenticated');

-- Perfiles: cada usuario ve el suyo; coordinador/admin ve todos
create policy "Ver propio perfil" on perfiles
  for select using (id = auth.uid() or auth_rol() in ('coordinador', 'administrador'));

create policy "Editar propio perfil" on perfiles
  for update using (id = auth.uid());

-- Escritura restringida a coordinador y administrador
create policy "Coordinador escribe materias" on materias
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe grupos" on grupos
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe espacios" on espacios
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe horarios" on horarios
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe sesiones" on sesiones
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe disponibilidad" on disponibilidad_docente
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Lectura historial" on historial_cambios
  for select using (auth_rol() in ('coordinador', 'administrador'));

create policy "Insertar historial" on historial_cambios
  for insert with check (auth.role() = 'authenticated');
