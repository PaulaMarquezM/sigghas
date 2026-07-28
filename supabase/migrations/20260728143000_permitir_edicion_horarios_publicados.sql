-- Los coordinadores pueden corregir sesiones incluso después de publicar.
-- Las políticas RLS y las validaciones de solapamiento siguen activas.

drop trigger if exists proteger_sesiones_publicadas on public.sesiones;
drop trigger if exists proteger_grupos_compartidos_publicados on public.sesiones_grupos_compartidos;
