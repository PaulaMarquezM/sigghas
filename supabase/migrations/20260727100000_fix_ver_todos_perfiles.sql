-- SIGGHAS — La página /dashboard/usuarios (administrador) solo mostraba el
-- propio perfil del administrador, no los 16 usuarios reales del sistema.
--
-- Verificado directo contra la base: auth_rol() devuelve 'administrador'
-- correctamente para esa sesión, pero "Ver propio perfil" solo dejaba ver
-- la propia fila — la policy vigente en la base ya no tenía la cláusula
-- "or auth_rol() in ('coordinador','administrador')" del esquema original
-- (001_schema_inicial.sql), probablemente editada manualmente en algún
-- punto fuera de las migraciones versionadas. Se reescribe explícita.

drop policy if exists "Ver propio perfil" on perfiles;
create policy "Ver propio perfil" on perfiles
  for select
  using (id = auth.uid() or auth_rol() in ('coordinador', 'administrador'));
