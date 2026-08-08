-- Fuerza cambio de contraseña en el primer acceso cuando el coordinador
-- aprovisiona la cuenta del docente con una contraseña temporal.
alter table public.perfiles
  add column if not exists debe_cambiar_password boolean not null default false;

comment on column public.perfiles.debe_cambiar_password is
  'Si es true, el usuario debe definir una contraseña propia antes de usar el dashboard.';
