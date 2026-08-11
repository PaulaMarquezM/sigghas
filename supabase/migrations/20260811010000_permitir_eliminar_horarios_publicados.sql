-- Permite a coordinadores y administradores eliminar horarios publicados.
-- La edición y el cambio de estado de un horario publicado siguen protegidos.

create or replace function public.impedir_mutacion_horario_publicado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Solo horarios tiene la columna estado. Los triggers heredados de
  -- sesiones y sesiones_grupos_compartidos también pueden invocar esta
  -- función, por lo que no se debe leer OLD.estado fuera de esta rama.
  if tg_table_name = 'horarios' then
    if tg_op = 'UPDATE'
      and old.estado = 'publicado'
      and new.estado is distinct from old.estado then
      raise exception 'Un horario publicado no puede cambiar de estado';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;
