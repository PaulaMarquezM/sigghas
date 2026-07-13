-- ============================================================
-- SIGGHAS — Fix FK historial_cambios.horario_id ON DELETE CASCADE
--           + política RLS DELETE para coordinador/administrador
-- ============================================================
-- Problema: La FK horario_id tenía NO ACTION (comportamiento por
-- defecto). Al intentar borrar un horario con historial asociado,
-- Postgres bloqueaba el DELETE aunque primero se intentara borrar
-- historial_cambios, porque RLS no tenía política DELETE y el
-- cliente autenticado no podía eliminar esas filas.
-- Solución doble:
--   1. ON DELETE CASCADE en historial_cambios.horario_id → al
--      borrar un horario Postgres elimina automáticamente su historial.
--   2. Política RLS DELETE explícita por si acaso se borra historial
--      de forma manual desde la aplicación.
-- ============================================================

-- 1. Cambiar la FK horario_id a ON DELETE CASCADE
alter table historial_cambios
  drop constraint historial_cambios_horario_id_fkey;

alter table historial_cambios
  add constraint historial_cambios_horario_id_fkey
  foreign key (horario_id) references horarios(id) on delete cascade;

-- 2. Política RLS para DELETE (coordinador y administrador)
create policy "Eliminar historial"
  on historial_cambios
  for delete
  using (auth_rol() in ('coordinador', 'administrador'));
