-- SIGGHAS — Permite administrar (crear/editar) sedes.
-- "sedes" solo tenía policy de lectura (bug 1, migración anterior habilitó
-- RLS pero no agregó escritura). Ahora se construyó la pantalla
-- /dashboard/sedes, exclusiva de administrador según el sidebar.

create policy "Administrador administra sedes" on sedes
  for all
  using (auth_rol() = 'administrador')
  with check (auth_rol() = 'administrador');
