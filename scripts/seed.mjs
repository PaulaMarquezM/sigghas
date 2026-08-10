// SIGGHAS — seed global de datos de prueba
// Uso: node --env-file=.env.local scripts/seed.mjs
//
// Usa la Service Role Key (bypasa RLS) para poblar:
// sedes (ya existen por migración), periodos, materias, grupos,
// espacios, usuarios de cada rol (coordinador/docente/
// administrador/apoyo), disponibilidad_docente, horarios, sesiones,
// sesiones_grupos_compartidos e historial_cambios.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Sigghas2026!";

async function upsertUser({ email, nombre, rol }) {
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const found = existing?.users.find((u) => u.email === email);
  if (found) {
    console.log(`~ usuario ya existe: ${email}`);
    return found.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });
  if (error) throw new Error(`crear usuario ${email}: ${error.message}`);
  console.log(`+ usuario creado: ${email} (${rol})`);
  return data.user.id;
}

async function main() {
  console.log("== sedes ==");
  const { data: sedes, error: sedesErr } = await supabase.from("sedes").select("id, nombre");
  if (sedesErr) throw sedesErr;
  const sedePortoviejo = sedes.find((s) => s.nombre === "Portoviejo").id;
  const sedeManta = sedes.find((s) => s.nombre === "Manta").id;

  console.log("== periodo ==");
  await supabase.from("periodos").update({ activo: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  let { data: periodo } = await supabase
    .from("periodos")
    .upsert({ nombre: "2026-I", fecha_inicio: "2026-05-01", fecha_fin: "2026-09-15", activo: true }, { onConflict: "nombre" })
    .select()
    .single();

  console.log("== usuarios ==");
  const coordinadorId = await upsertUser({ email: "coordinador@sigghas.test", nombre: "Coordinador Demo", rol: "coordinador" });
  const adminId = await upsertUser({ email: "admin@sigghas.test", nombre: "Administrador Demo", rol: "administrador" });
  const apoyoId = await upsertUser({ email: "apoyo@sigghas.test", nombre: "Apoyo Demo", rol: "apoyo" });

  const docentesInfo = [
    { email: "docente.tc@sigghas.test", nombre: "Docente Tiempo Completo", tipo_contrato: "titular", entrada: "08:00", salida: "16:00", max: 40, sede: sedePortoviejo },
    { email: "docente.horas1@sigghas.test", nombre: "Docente Por Horas Uno", tipo_contrato: "contratado", entrada: null, salida: null, max: 20, sede: sedePortoviejo },
    { email: "docente.horas2@sigghas.test", nombre: "Docente Por Horas Dos", tipo_contrato: "honorarios", entrada: null, salida: null, max: 16, sede: sedeManta },
  ];

  const docenteIds = [];
  for (const d of docentesInfo) {
    const id = await upsertUser({ email: d.email, nombre: d.nombre, rol: "docente" });
    await supabase.from("perfiles").update({ sede_id: d.sede }).eq("id", id);
    await supabase.from("docentes").upsert({
      id,
      tipo_contrato: d.tipo_contrato,
      hora_entrada: d.entrada,
      hora_salida: d.salida,
      max_horas_semana: d.max,
      sede_principal_id: d.sede,
    });
    await supabase.from("docente_sedes").upsert({ docente_id: id, sede_id: d.sede }, { onConflict: "docente_id,sede_id" });
    docenteIds.push(id);
  }

  // docente.horas1 y docente.horas2 quedan habilitados en ambas sedes: los
  // fixtures de Cypress (cypress/support/tasks.ts) los usan juntos en la
  // primera sede que devuelva la BD, sin importar cuál sea.
  await supabase.from("docente_sedes").upsert(
    [
      { docente_id: docenteIds[1], sede_id: sedeManta },
      { docente_id: docenteIds[2], sede_id: sedePortoviejo },
    ],
    { onConflict: "docente_id,sede_id" }
  );

  await supabase.from("perfiles").update({ sede_id: sedePortoviejo }).eq("id", coordinadorId);
  await supabase.from("perfiles").update({ sede_id: sedePortoviejo }).eq("id", adminId);
  await supabase.from("perfiles").update({ sede_id: sedePortoviejo }).eq("id", apoyoId);

  console.log("== disponibilidad docentes ==");
  await supabase.from("disponibilidad_docente").delete().in("docente_id", docenteIds);
  const disponibilidadRows = [];
  for (const docenteId of docenteIds) {
    for (const dia of [1, 2, 3, 4, 5]) {
      disponibilidadRows.push({ docente_id: docenteId, dia_semana: dia, hora_inicio: "08:00", hora_fin: "12:00", es_tiempo_oficina: false });
      disponibilidadRows.push({ docente_id: docenteId, dia_semana: dia, hora_inicio: "14:00", hora_fin: "16:00", es_tiempo_oficina: dia === 5 });
    }
  }
  await supabase.from("disponibilidad_docente").insert(disponibilidadRows);

  console.log("== materias ==");
  const materiasSeed = [
    { codigo: "SW101", nombre: "Programación I", semestre: 1, nivel: 1, horas_teoria: 3, horas_practica: 2, horas_semana: 5, requiere_laboratorio: true, modalidad: "presencial" },
    { codigo: "SW102", nombre: "Bases de Datos", semestre: 3, nivel: 3, horas_teoria: 3, horas_practica: 1, horas_semana: 4, requiere_laboratorio: true, modalidad: "presencial" },
    { codigo: "SW103", nombre: "Ingeniería de Software", semestre: 5, nivel: 5, horas_teoria: 4, horas_practica: 0, horas_semana: 4, requiere_laboratorio: false, modalidad: "hibrida" },
    { codigo: "SW104", nombre: "Redes de Computadoras", semestre: 5, nivel: 5, horas_teoria: 2, horas_practica: 2, horas_semana: 4, requiere_laboratorio: true, modalidad: "presencial" },
    { codigo: "SW105", nombre: "Inteligencia Artificial", semestre: 7, nivel: 7, horas_teoria: 3, horas_practica: 1, horas_semana: 4, requiere_laboratorio: false, modalidad: "virtual" },
    { codigo: "SW106", nombre: "Gestión de Proyectos", semestre: 8, nivel: 8, horas_teoria: 3, horas_practica: 0, horas_semana: 3, requiere_laboratorio: false, modalidad: "hibrida", activo: false },
  ];
  for (const m of materiasSeed) {
    await supabase.from("materias").upsert(m, { onConflict: "codigo" });
  }
  const { data: materias } = await supabase.from("materias").select("id, codigo");

  console.log("== grupos ==");
  const gruposSeed = [
    { nombre: "SW-1A", semestre: 1, cantidad_estudiantes: 30, sede_id: sedePortoviejo, requiere_accesibilidad: false, activo: true },
    { nombre: "SW-3A", semestre: 3, cantidad_estudiantes: 28, sede_id: sedePortoviejo, requiere_accesibilidad: true, activo: true },
    { nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 25, sede_id: sedePortoviejo, requiere_accesibilidad: false, activo: true },
    { nombre: "SW-5B", semestre: 5, cantidad_estudiantes: 22, sede_id: sedeManta, requiere_accesibilidad: false, activo: true },
    { nombre: "SW-7A", semestre: 7, cantidad_estudiantes: 20, sede_id: sedeManta, requiere_accesibilidad: false, activo: true },
  ];
  await supabase.from("grupos").delete().in("nombre", gruposSeed.map((g) => g.nombre));
  const { data: grupos } = await supabase.from("grupos").insert(gruposSeed).select();

  console.log("== espacios ==");
  const espaciosSeed = [
    { nombre: "Aula 101", tipo: "aula", capacidad: 35, accesible: true, sede_id: sedePortoviejo, disponible: true, activo: true, tiene_proyector: true, tiene_internet: true },
    { nombre: "Aula 102", tipo: "aula", capacidad: 30, accesible: false, sede_id: sedePortoviejo, disponible: true, activo: true, tiene_proyector: true, tiene_internet: true },
    { nombre: "Lab-A", tipo: "laboratorio", capacidad: 25, accesible: true, sede_id: sedePortoviejo, disponible: true, activo: true, tiene_proyector: true, tiene_internet: true },
    { nombre: "Auditorio Central", tipo: "auditorio", capacidad: 120, accesible: true, sede_id: sedePortoviejo, disponible: true, activo: true, tiene_proyector: true, tiene_internet: true },
    { nombre: "Aula 201", tipo: "aula", capacidad: 28, accesible: false, sede_id: sedeManta, disponible: true, activo: true, tiene_proyector: false, tiene_internet: true },
    { nombre: "Lab-B", tipo: "laboratorio", capacidad: 20, accesible: false, sede_id: sedeManta, disponible: false, activo: false, tiene_proyector: true, tiene_internet: true },
    { nombre: "Sala Reuniones 1", tipo: "sala_reuniones", capacidad: 10, accesible: true, sede_id: sedeManta, disponible: true, activo: true, tiene_proyector: false, tiene_internet: true },
  ];
  await supabase.from("espacios").delete().in("nombre", espaciosSeed.map((e) => e.nombre));
  const { data: espacios } = await supabase.from("espacios").insert(espaciosSeed).select();

  console.log("== horarios ==");
  // Un periodo solo puede tener un horario (migración
  // 20260803120000_unico_horario_por_periodo.sql), y uno publicado no se
  // puede borrar ni cambiar de estado (proteger_horario_publicado). Por eso
  // esto es idempotente: reutiliza el horario del periodo si ya existe.
  const { data: horarioExistente } = await supabase
    .from("horarios")
    .select("id")
    .eq("periodo_id", periodo.id)
    .maybeSingle();
  let horarioPublicado = horarioExistente?.id;
  if (!horarioPublicado) {
    const { data: horarioRows, error: errHorario } = await supabase
      .from("horarios")
      .insert([{ periodo_id: periodo.id, estado: "publicado", generado_en: new Date().toISOString(), aprobado_en: new Date().toISOString(), aprobado_por: coordinadorId }])
      .select();
    if (errHorario) throw errHorario;
    horarioPublicado = horarioRows[0].id;
  }

  const byCodigo = (c) => materias.find((m) => m.codigo === c).id;
  const byNombreGrupo = (n) => grupos.find((g) => g.nombre === n).id;
  const byNombreEspacio = (n) => espacios.find((e) => e.nombre === n).id;

  console.log("== sesiones ==");

  const sesionesSeed = [
    { horario_id: horarioPublicado, materia_id: byCodigo("SW101"), docente_id: docenteIds[0], grupo_id: byNombreGrupo("SW-1A"), espacio_id: byNombreEspacio("Lab-A"), modalidad: "presencial", dia_semana: 1, hora_inicio: "08:00", hora_fin: "10:00", sede_id: sedePortoviejo },
    { horario_id: horarioPublicado, materia_id: byCodigo("SW102"), docente_id: docenteIds[1], grupo_id: byNombreGrupo("SW-3A"), espacio_id: byNombreEspacio("Aula 101"), modalidad: "presencial", dia_semana: 2, hora_inicio: "10:00", hora_fin: "12:00", sede_id: sedePortoviejo },
    { horario_id: horarioPublicado, materia_id: byCodigo("SW104"), docente_id: docenteIds[0], grupo_id: byNombreGrupo("SW-5A"), espacio_id: byNombreEspacio("Aula 102"), modalidad: "presencial", dia_semana: 3, hora_inicio: "08:00", hora_fin: "10:00", sede_id: sedePortoviejo },
    { horario_id: horarioPublicado, materia_id: byCodigo("SW103"), docente_id: docenteIds[2], grupo_id: byNombreGrupo("SW-5B"), espacio_id: null, modalidad: "hibrida", dia_semana: 4, hora_inicio: "14:00", hora_fin: "16:00", sede_id: sedeManta },
    { horario_id: horarioPublicado, materia_id: byCodigo("SW105"), docente_id: docenteIds[2], grupo_id: byNombreGrupo("SW-7A"), espacio_id: null, modalidad: "virtual", dia_semana: 5, hora_inicio: "08:00", hora_fin: "10:00", sede_id: sedeManta },
    { horario_id: horarioPublicado, materia_id: byCodigo("SW101"), docente_id: docenteIds[0], grupo_id: byNombreGrupo("SW-1A"), espacio_id: byNombreEspacio("Auditorio Central"), modalidad: "presencial", dia_semana: 1, hora_inicio: "10:00", hora_fin: "12:00", sede_id: sedePortoviejo },
  ];
  await supabase.from("sesiones").delete().eq("horario_id", horarioPublicado);
  const { data: sesiones, error: errSesiones } = await supabase.from("sesiones").insert(sesionesSeed).select();
  if (errSesiones) throw errSesiones;

  console.log("== sesiones compartidas (virtual, RN21) ==");
  const sesionVirtual = sesiones.find((s) => s.modalidad === "virtual");
  await supabase.from("sesiones_grupos_compartidos").insert([
    { sesion_id: sesionVirtual.id, grupo_id: byNombreGrupo("SW-7A") },
    { sesion_id: sesionVirtual.id, grupo_id: byNombreGrupo("SW-5B") },
  ]);

  console.log("== historial de cambios ==");
  await supabase.from("historial_cambios").insert([
    { sesion_id: sesiones[0].id, horario_id: horarioPublicado, usuario_id: coordinadorId, accion: "creacion", detalle: { nota: "sesión inicial seed" } },
    { sesion_id: sesiones[1].id, horario_id: horarioPublicado, usuario_id: coordinadorId, accion: "edicion", detalle: { cambio: "espacio asignado" } },
  ]);

  console.log("\n✔ seed completo");
  console.log(`  password para todos los usuarios de prueba: ${PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
