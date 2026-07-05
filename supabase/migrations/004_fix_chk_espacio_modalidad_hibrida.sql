-- ============================================================
-- SIGGHAS — Fix chk_espacio_modalidad para modalidad 'hibrida'
-- 002_alinear_fase2_entidades.sql agregó 'hibrida' al enum
-- modalidad_clase pero no actualizó este constraint: cualquier
-- insert con modalidad = 'hibrida' viola chk_espacio_modalidad
-- sin importar el valor de espacio_id (ni 'virtual' ni
-- 'presencial' matchea). 'hibrida' requiere espacio físico igual
-- que 'presencial' (tiene componente presencial).
-- ============================================================

alter table sesiones
  drop constraint chk_espacio_modalidad;

alter table sesiones
  add constraint chk_espacio_modalidad check (
    (modalidad = 'virtual') or (modalidad in ('presencial', 'hibrida') and espacio_id is not null)
  );
