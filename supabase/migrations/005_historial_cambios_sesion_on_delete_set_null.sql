-- ============================================================
-- SIGGHAS — historial_cambios.sesion_id ON DELETE SET NULL
-- Sin ON DELETE, la FK por defecto (NO ACTION) bloqueaba el
-- DELETE FROM sesiones al regenerar un horario cuyas sesiones
-- ya tenían historial (ej. movidas antes en el editor manual).
-- El DELETE fallaba completo (rollback), dejando las sesiones
-- viejas intactas, y el INSERT posterior las duplicaba —
-- provocando falsos conflictos RN03/RN04 entre una sesión y su
-- propio duplicado. El historial ya guarda el snapshot en
-- `detalle`, así que no necesita la fila de sesiones viva.
-- ============================================================

alter table historial_cambios
  drop constraint historial_cambios_sesion_id_fkey;

alter table historial_cambios
  add constraint historial_cambios_sesion_id_fkey
  foreign key (sesion_id) references sesiones(id) on delete set null;
