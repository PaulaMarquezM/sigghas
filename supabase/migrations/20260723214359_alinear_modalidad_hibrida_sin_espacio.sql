-- El planificador trata las sesiones híbridas como remotas para efectos de
-- asignación de espacios: no reservan un aula y pueden compartirse entre
-- grupos. Normaliza las sesiones creadas con la regla anterior, que exigía
-- un espacio físico para la modalidad híbrida.

alter table public.sesiones
  drop constraint if exists chk_espacio_modalidad;

update public.sesiones
set espacio_id = null
where modalidad in ('virtual', 'hibrida')
  and espacio_id is not null;

alter table public.sesiones
  add constraint chk_espacio_modalidad check (
    (modalidad = 'presencial' and espacio_id is not null)
    or (modalidad in ('virtual', 'hibrida') and espacio_id is null)
  );
