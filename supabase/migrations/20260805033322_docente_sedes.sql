-- Un docente puede estar habilitado para impartir clases en una o varias sedes.
create table if not exists public.docente_sedes (
  docente_id uuid not null references public.docentes(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete restrict,
  creado_en timestamptz not null default now(),
  primary key (docente_id, sede_id)
);

-- Conserva la sede principal de los docentes ya registrados como primera sede asignada.
insert into public.docente_sedes (docente_id, sede_id)
select id, sede_principal_id
from public.docentes
where sede_principal_id is not null
on conflict (docente_id, sede_id) do nothing;

alter table public.docente_sedes enable row level security;

grant select, insert, update, delete on public.docente_sedes to authenticated;

create policy "Docente lee sus sedes asignadas"
on public.docente_sedes for select to authenticated
using (docente_id = (select auth.uid()) or public.auth_rol() in ('coordinador', 'administrador'));

create policy "Coordinador gestiona sedes docentes"
on public.docente_sedes for all to authenticated
using (public.auth_rol() in ('coordinador', 'administrador'))
with check (public.auth_rol() in ('coordinador', 'administrador'));
