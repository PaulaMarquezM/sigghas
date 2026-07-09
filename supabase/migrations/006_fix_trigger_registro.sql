-- ============================================================
-- SIGGHAS — Corrección del trigger de registro
-- Mejora el manejo de errores para evitar que el registro falle
-- si ocurre un error inesperado al procesar la metadata.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _rol public.rol_usuario;
  _nombre text;
begin
  -- 1. Extraer y validar el rol de forma segura
  begin
    _rol := (new.raw_user_meta_data->>'rol')::public.rol_usuario;
  exception when others then
    _rol := 'estudiante'::public.rol_usuario;
  end;

  if _rol is null then
    _rol := 'estudiante'::public.rol_usuario;
  end;

  -- 2. Extraer y validar el nombre de forma segura
  _nombre := new.raw_user_meta_data->>'nombre';
  if _nombre is null or trim(_nombre) = '' then
    _nombre := split_part(new.email, '@', 1);
  end;

  -- 3. Insertar el perfil
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    _nombre,
    new.email,
    _rol
  )
  on conflict (id) do update set
    nombre = excluded.nombre,
    rol = excluded.rol;

  return new;
exception when others then
  -- Si ocurre cualquier otro error a nivel de base de datos, 
  -- permitimos que el usuario se cree en auth.users
  -- (opcionalmente se puede registrar el error en otra tabla de logs)
  raise warning 'Error al crear perfil para el usuario %: %', new.id, SQLERRM;
  return new;
end;
$$;
