-- ============================================================
-- SIGGHAS — Fix auth_rol infinite recursion in RLS
-- ============================================================

create or replace function auth_rol()
returns rol_usuario language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid()
$$;
