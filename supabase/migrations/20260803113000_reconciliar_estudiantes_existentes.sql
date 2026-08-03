-- Asegura que los perfiles estudiante creados antes de RF17 tengan su registro asociado.
insert into public.estudiantes (id)
select id from public.perfiles where rol = 'estudiante'
on conflict (id) do nothing;
