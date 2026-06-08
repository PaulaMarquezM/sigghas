-- ============================================================
-- SIGGHAS — Ajustes Fase 2
-- Alinea las entidades con DIVISION_TRABAJO.md sin romper datos
-- existentes del schema inicial.
-- ============================================================

alter type tipo_contrato add value if not exists 'titular';
alter type tipo_contrato add value if not exists 'contratado';
alter type tipo_contrato add value if not exists 'honorarios';

alter type modalidad_clase add value if not exists 'hibrida';

alter type tipo_espacio add value if not exists 'sala_reuniones';
alter type tipo_espacio add value if not exists 'auditorio';

alter table materias
  add column if not exists nivel smallint check (nivel between 1 and 10),
  add column if not exists horas_teoria smallint not null default 2,
  add column if not exists horas_practica smallint not null default 0,
  add column if not exists modalidad modalidad_clase not null default 'presencial',
  add column if not exists activo boolean not null default true;

update materias
set nivel = semestre
where nivel is null;

alter table materias
  alter column nivel set not null;

alter table espacios
  add column if not exists tiene_proyector boolean not null default false,
  add column if not exists tiene_internet boolean not null default true,
  add column if not exists activo boolean not null default true;

update espacios
set activo = disponible
where activo is distinct from disponible;

create index if not exists idx_materias_activo on materias(activo);
create index if not exists idx_materias_nivel on materias(nivel);
create index if not exists idx_espacios_activo on espacios(activo);
