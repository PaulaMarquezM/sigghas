-- SIGGHAS — Evita acceder a columnas que no existen en triggers compartidos (reaplicable).
--
-- La función se invoca desde tres tablas. OLD adopta el tipo de la tabla que
-- disparó el trigger, por lo que OLD.estado solo es válido para horarios.

create or replace function impedir_mutacion_horario_publicado()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'horarios' then
    if old.estado = 'publicado' and new.estado is distinct from old.estado then
      raise exception 'Un horario publicado es inmutable';
    end if;
  elsif tg_table_name = 'sesiones' then
    if exists (
      select 1 from horarios
      where id = old.horario_id and estado = 'publicado'
    ) then
      raise exception 'No se pueden modificar sesiones de un horario publicado';
    end if;
  elsif tg_table_name = 'sesiones_grupos_compartidos' then
    if exists (
      select 1
      from sesiones
      join horarios on horarios.id = sesiones.horario_id
      where sesiones.id = old.sesion_id and horarios.estado = 'publicado'
    ) then
      raise exception 'No se pueden modificar grupos de una sesión publicada';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;
