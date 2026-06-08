-- ============================================================
-- SIGGHAS — Registro de usuarios
-- Crea el perfil automáticamente al registrar un usuario en
-- auth.users. Corre como SECURITY DEFINER para evitar el bloqueo
-- de RLS (la tabla perfiles no tiene política de INSERT y, con
-- confirmación de correo activada, el signUp no deja sesión).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'estudiante')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
