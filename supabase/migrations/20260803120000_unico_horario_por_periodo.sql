-- Un período académico solo puede tener un horario.
-- La edición de ese horario se realiza sobre el mismo registro desde el editor manual.
create or replace function public.impedir_horario_duplicado_por_periodo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Evita que dos solicitudes concurrentes creen horarios para el mismo período.
  perform pg_advisory_xact_lock(hashtextextended(new.periodo_id::text, 0));
  if exists (select 1 from public.horarios where periodo_id = new.periodo_id) then
    raise exception 'Ya existe un horario para este período; edita el horario existente.';
  end if;
  return new;
end;
$$;

drop trigger if exists impedir_horario_duplicado_por_periodo on public.horarios;
create trigger impedir_horario_duplicado_por_periodo
before insert on public.horarios
for each row execute function public.impedir_horario_duplicado_por_periodo();
