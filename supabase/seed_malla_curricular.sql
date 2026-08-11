-- SIGGHAS — Carga de la malla curricular de Ingeniería de Software
--
-- IMPORTANTE:
--   1. Ejecutar en Supabase > SQL Editor con una cuenta administradora.
--   2. Este script elimina datos académicos y horarios existentes.
--   3. Conserva perfiles, coordinadores, docentes, sedes, aulas y sus
--      disponibilidades.
--   4. Crea un período activo, ocho cursos (uno por semestre), 48 materias,
--      asignaciones y un horario de ejemplo.

begin;

-- Eliminar primero las filas dependientes para respetar las claves foráneas.
-- Se desactivan temporalmente solo los triggers de protección del horario;
-- se restauran al final para que los nuevos horarios sigan protegidos.
drop trigger if exists proteger_horario_publicado on horarios;
drop trigger if exists proteger_sesiones_publicadas on sesiones;
drop trigger if exists proteger_grupos_compartidos_publicados on sesiones_grupos_compartidos;

delete from historial_cambios;
delete from sesiones_grupos_compartidos;
delete from sesiones;
delete from asignaciones_docente_periodo;
delete from horarios;
delete from grupos;
delete from materias;
delete from periodos;

do $$
declare
  sede_id uuid;
  periodo_id uuid;
  horario_id uuid;
  grupo_id uuid;
  materia_id uuid;
  docente_ids uuid[];
  espacio_ids uuid[];
  nombres text[][] := array[
    array['Conocimiento, Palabra y Cambio Social', 'Cálculo I', 'Física General', 'Pensamiento Computacional', 'Innovación y Creatividad', 'Técnicas Gráficas y Geométricas'],
    array['Fundamentos de Investigación', 'Cálculo II', 'Estadística Aplicada', 'Programación I', 'Ciencias de los Materiales, Procesos y Ciclos', 'Álgebra Lineal y Geometría Analítica'],
    array['Jesucristo y Aprendizajes Vitales', 'Estructuras de Datos', 'Fundamentos de Bases de Datos', 'Programación II', 'Fundamentos Web', 'Sistemas Operativos'],
    array['Algoritmos y Complejidad', 'Ingeniería de Software I', 'Base de Datos Avanzada', 'Arquitectura de Software', 'Desarrollo de Aplicaciones Web (H)', 'Arquitectura de Computadoras'],
    array['Ética e Interculturalidad', 'Ingeniería de Software II', 'Administración de Servidores Web', 'Inteligencia Artificial', 'Virtualización y Computación en la Nube', 'Interacción Humano-Computadora'],
    array['Ecología Integral', 'Procesamiento Masivo de Datos', 'Seguridad de Software', 'Desarrollo de Aplicaciones Móviles', 'Internet de las Cosas', 'Motores Gráficos'],
    array['Seminario de Titulación', 'Asignatura 1 de Itinerario', 'Asignatura 2 de Itinerario', 'Industria y Publicación de Videojuegos', 'Diseño de Videojuegos', 'Gestión Pública'],
    array['Integración Curricular', 'Asignatura 3 de Itinerario', 'Asignatura 4 de Itinerario', 'Informática Legal', 'Mecánica de Juego y Desarrollo de Creatividad', 'Modelado, Texturizado y Animación Digital Tridimensional']
  ];
  semestre integer;
  indice integer;
  codigo text;
  dia integer;
  hora_inicio time;
  hora_fin time;
  docente_id uuid;
  espacio_id uuid;
begin
  select id into sede_id from sedes order by es_central desc, nombre limit 1;
  select array_agg(id order by id) into docente_ids from docentes;
  select array_agg(id order by id) into espacio_ids from espacios where disponible = true and activo = true;

  if sede_id is null then raise exception 'No existe ninguna sede'; end if;
  if coalesce(array_length(docente_ids, 1), 0) = 0 then raise exception 'No existen docentes para asignar'; end if;
  if coalesce(array_length(espacio_ids, 1), 0) = 0 then raise exception 'No existen aulas disponibles para asignar'; end if;

  insert into periodos (nombre, fecha_inicio, fecha_fin, activo)
  values ('Malla Curricular 2026-2027', '2026-08-01', '2027-07-31', true)
  returning id into periodo_id;

  insert into horarios (periodo_id, estado, generado_en)
  values (periodo_id, 'borrador', now())
  returning id into horario_id;

  for semestre in 1..8 loop
    insert into grupos (nombre, semestre, cantidad_estudiantes, sede_id, activo)
    values (format('IS-%sA', semestre), semestre, 30, sede_id, true)
    returning id into grupo_id;

    for indice in 1..6 loop
      codigo := format('IS%s%02s', semestre, indice);

      insert into materias (
        codigo, nombre, semestre, nivel, horas_semana,
        horas_teoria, horas_practica, requiere_laboratorio,
        modalidad, activo
      ) values (
        codigo, nombres[semestre][indice], semestre, semestre, 2,
        2, 0, false, 'presencial', true
      ) returning id into materia_id;

      docente_id := docente_ids[1 + ((semestre + indice - 2) % array_length(docente_ids, 1))];
      insert into asignaciones_docente_periodo (periodo_id, materia_id, grupo_id, docente_id)
      values (periodo_id, materia_id, grupo_id, docente_id);

      -- Horario de ejemplo: seis bloques semanales por semestre.
      dia := indice;
      hora_inicio := case when indice <= 3 then time '08:00' else time '14:00' end;
      hora_fin := hora_inicio + interval '2 hours';
      espacio_id := espacio_ids[1 + ((semestre + indice - 2) % array_length(espacio_ids, 1))];

      insert into sesiones (
        horario_id, materia_id, docente_id, grupo_id, espacio_id,
        modalidad, dia_semana, hora_inicio, hora_fin, sede_id
      ) values (
        horario_id, materia_id, docente_id, grupo_id, espacio_id,
        'presencial', dia, hora_inicio, hora_fin, sede_id
      );
    end loop;
  end loop;
end $$;

create or replace function public.impedir_mutacion_horario_publicado()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'horarios' then
    if tg_op = 'UPDATE' and old.estado = 'publicado'
      and new.estado is distinct from old.estado then
      raise exception 'Un horario publicado no puede cambiar de estado';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger proteger_horario_publicado before update or delete on horarios
for each row execute function public.impedir_mutacion_horario_publicado();

create trigger proteger_sesiones_publicadas before update or delete on sesiones
for each row execute function public.impedir_mutacion_horario_publicado();

create trigger proteger_grupos_compartidos_publicados before update or delete on sesiones_grupos_compartidos
for each row execute function public.impedir_mutacion_horario_publicado();

commit;

-- Comprobación rápida: 48 materias, 8 grupos, un período y un horario.
select
  (select count(*) from materias) as materias,
  (select count(*) from grupos) as grupos,
  (select count(*) from periodos) as periodos,
  (select count(*) from horarios) as horarios,
  (select count(*) from sesiones) as sesiones;
