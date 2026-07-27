-- ============================================================
-- SIGGHAS — Eliminar el rol 'estudiante' del sistema
-- ============================================================
-- El sistema pasa a manejar únicamente los roles docente y
-- coordinador (más administrador/apoyo internos). Postgres no
-- permite ALTER TYPE ... DROP VALUE, así que hay que recrear el
-- enum. Como el enum lo usan la columna perfiles.rol, la función
-- auth_rol() y ~9 políticas RLS, esta migración:
--   1. Reasigna los perfiles existentes 'estudiante' -> 'docente'.
--   2. Suelta las políticas y la función que dependen del enum.
--   3. Recrea el enum sin 'estudiante'.
--   4. Migra la columna, restaura el default como 'docente'.
--   5. Recrea auth_rol(), las políticas y el trigger de registro.
-- Toda la migración corre en una transacción (todo o nada).
-- ⚠️  Irreversible: haz respaldo antes de aplicar en producción.
-- ============================================================

-- 1. Reasignar perfiles existentes con rol 'estudiante'
update public.perfiles set rol = 'docente' where rol = 'estudiante';

-- 2. Quitar el default de la columna (depende del enum)
alter table public.perfiles alter column rol drop default;

-- 3. Soltar las políticas RLS que usan auth_rol()
drop policy if exists "Ver propio perfil"              on public.perfiles;
drop policy if exists "Coordinador escribe materias"   on public.materias;
drop policy if exists "Coordinador escribe grupos"     on public.grupos;
drop policy if exists "Coordinador escribe espacios"   on public.espacios;
drop policy if exists "Coordinador escribe horarios"   on public.horarios;
drop policy if exists "Coordinador escribe sesiones"   on public.sesiones;
drop policy if exists "Coordinador escribe disponibilidad" on public.disponibilidad_docente;
drop policy if exists "Lectura historial"              on public.historial_cambios;
drop policy if exists "Eliminar historial"             on public.historial_cambios;

-- 4. Soltar la función auth_rol() (ya sin dependencias)
drop function if exists public.auth_rol();

-- 5. Recrear el enum sin 'estudiante'
alter type public.rol_usuario rename to rol_usuario_old;
create type public.rol_usuario as enum ('coordinador', 'docente', 'administrador', 'apoyo');

-- 6. Migrar la columna al nuevo tipo
alter table public.perfiles
  alter column rol type public.rol_usuario using rol::text::public.rol_usuario;

-- 7. Restaurar el default (ahora 'docente')
alter table public.perfiles alter column rol set default 'docente';

-- 8. Eliminar el tipo viejo
drop type public.rol_usuario_old;

-- 9. Recrear auth_rol() con el nuevo tipo
create or replace function public.auth_rol()
returns public.rol_usuario language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where id = auth.uid()
$$;

-- 10. Recrear las políticas RLS
create policy "Ver propio perfil" on public.perfiles
  for select using (id = auth.uid() or auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe materias" on public.materias
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe grupos" on public.grupos
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe espacios" on public.espacios
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe horarios" on public.horarios
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe sesiones" on public.sesiones
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador escribe disponibilidad" on public.disponibilidad_docente
  for all using (auth_rol() in ('coordinador', 'administrador'));

create policy "Lectura historial" on public.historial_cambios
  for select using (auth_rol() in ('coordinador', 'administrador'));

create policy "Eliminar historial" on public.historial_cambios
  for delete using (auth_rol() in ('coordinador', 'administrador'));

-- 11. Actualizar el trigger de registro para usar 'docente' por defecto
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
    _rol := 'docente'::public.rol_usuario;
  end;

  if _rol is null then
    _rol := 'docente'::public.rol_usuario;
  end if;

  -- 2. Extraer y validar el nombre de forma segura
  _nombre := new.raw_user_meta_data->>'nombre';
  if _nombre is null or trim(_nombre) = '' then
    _nombre := split_part(new.email, '@', 1);
  end if;

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
  raise warning 'Error al crear perfil para el usuario %: %', new.id, SQLERRM;
  return new;
end;
$$;
