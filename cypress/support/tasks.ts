/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cuentas creadas por scripts/seed.mjs — se reutilizan para no crear/borrar
// usuarios de auth en cada corrida. Deben existir en el proyecto de Supabase
// contra el que se corre Cypress (correr "npm run db:seed" antes de las pruebas).
const DOCENTE_A_EMAIL = "docente.horas1@sigghas.test";
const DOCENTE_B_EMAIL = "docente.horas2@sigghas.test";

const DIA_PRUEBA = 1; // Lunes
// Debe caer dentro de la jornada institucional Y coincidir con las franjas
// que renderiza HorarioGrid.tsx (HORAS empieza a las 08:00 en bloques de 30min).
const HORA_INICIO = "08:00";
const HORA_FIN = "10:00";

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SERVICE_ROLE_KEY para los cy.task de Cypress. Agrégalos a .env.local."
    );
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function idDePerfilPorEmail(admin: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await admin.from("perfiles").select("id").eq("email", email).single();
  if (error || !data) {
    throw new Error(
      `No se encontró el perfil "${email}". Corre "npm run db:seed" contra el proyecto de Supabase antes de las pruebas E2E.`
    );
  }
  return data.id as string;
}

async function sedeDePrueba(admin: SupabaseClient): Promise<string> {
  const { data, error } = await admin.from("sedes").select("id").limit(1).single();
  if (error || !data) throw new Error("No hay ninguna fila en 'sedes'. Corre las migraciones/seed antes de las pruebas E2E.");
  return data.id as string;
}

async function espaciosDePrueba(admin: SupabaseClient, sedeId: string, cantidad: number): Promise<string[]> {
  const { data, error } = await admin
    .from("espacios")
    .select("id")
    .eq("sede_id", sedeId)
    .eq("disponible", true)
    .eq("activo", true)
    .limit(cantidad);
  if (error || !data || data.length < cantidad) {
    throw new Error(
      `Se necesitan al menos ${cantidad} espacios disponibles/activos en la sede de prueba; hay ${data?.length ?? 0}. Agrega más espacios al seed.`
    );
  }
  return data.map((e) => e.id as string);
}

// generate() (src/lib/scheduler/index.ts) evalúa TODAS las materias/grupos
// activos del sistema, no solo los del fixture — así que para poder afirmar
// un resultado 100% determinístico (éxito o fallo exacto) hay que aislar
// temporalmente los reales mientras corre el caso, y restaurarlos después.
async function aislarMateriasYGrupos(admin: SupabaseClient) {
  const { data: materias } = await admin.from("materias").select("id").eq("activo", true);
  const { data: grupos } = await admin.from("grupos").select("id").eq("activo", true);
  const materiaIds = (materias ?? []).map((m) => m.id as string);
  const grupoIds = (grupos ?? []).map((g) => g.id as string);
  if (materiaIds.length) await admin.from("materias").update({ activo: false }).in("id", materiaIds);
  if (grupoIds.length) await admin.from("grupos").update({ activo: false }).in("id", grupoIds);
  return { materiaIdsAislados: materiaIds, grupoIdsAislados: grupoIds };
}

async function restaurarMateriasYGrupos(admin: SupabaseClient, materiaIds: string[], grupoIds: string[]) {
  if (materiaIds.length) await admin.from("materias").update({ activo: true }).in("id", materiaIds);
  if (grupoIds.length) await admin.from("grupos").update({ activo: true }).in("id", grupoIds);
}

async function crearMateriaYGrupos(admin: SupabaseClient, sufijo: string, sedeId: string, cantidadGrupos: number) {
  const { data: materia, error: errMateria } = await admin
    .from("materias")
    .insert({
      codigo: `E2E-${sufijo}`,
      nombre: `E2E Materia ${sufijo}`,
      semestre: 1,
      nivel: 1,
      horas_semana: 2,
      horas_teoria: 2,
      horas_practica: 0,
      requiere_laboratorio: false,
      modalidad: "presencial",
      activo: true,
    })
    .select("id")
    .single();
  if (errMateria) throw new Error(errMateria.message);

  const grupoIds: string[] = [];
  for (let i = 0; i < cantidadGrupos; i++) {
    const { data: grupo, error: errGrupo } = await admin
      .from("grupos")
      .insert({
        nombre: `E2E-Grupo-${sufijo}-${i}`,
        semestre: 1,
        cantidad_estudiantes: 10,
        sede_id: sedeId,
        activo: true,
      })
      .select("id")
      .single();
    if (errGrupo) throw new Error(errGrupo.message);
    grupoIds.push(grupo.id as string);
  }

  return { materiaId: materia.id as string, grupoIds };
}

async function borrarMateriaYGrupos(admin: SupabaseClient, materiaId: string, grupoIds: string[]) {
  await admin.from("grupos").delete().in("id", grupoIds);
  await admin.from("materias").delete().eq("id", materiaId);
}

// ---------------------------------------------------------------------------
// Caso 1: crear horario válido
// ---------------------------------------------------------------------------
async function prepararPeriodoValido() {
  const admin = adminClient();
  const sufijo = `VAL-${Date.now()}`;
  const sedeId = await sedeDePrueba(admin);
  const docenteId = await idDePerfilPorEmail(admin, DOCENTE_A_EMAIL);
  const { materiaIdsAislados, grupoIdsAislados } = await aislarMateriasYGrupos(admin);
  const { materiaId, grupoIds } = await crearMateriaYGrupos(admin, sufijo, sedeId, 1);

  const periodoNombre = `E2E-Periodo-${sufijo}`;
  const { data: periodo, error: errPeriodo } = await admin
    .from("periodos")
    .insert({ nombre: periodoNombre, fecha_inicio: "2026-01-01", fecha_fin: "2026-06-30", activo: true })
    .select("id")
    .single();
  if (errPeriodo) throw new Error(errPeriodo.message);
  const periodoId = periodo.id as string;

  const { data: disponibilidad, error: errDisp } = await admin
    .from("disponibilidad_docente")
    .insert({
      docente_id: docenteId,
      dia_semana: DIA_PRUEBA,
      hora_inicio: HORA_INICIO,
      hora_fin: "12:00",
      es_tiempo_oficina: false,
    })
    .select("id")
    .single();
  if (errDisp) throw new Error(errDisp.message);

  const { error: errAsignacion } = await admin.from("asignaciones_docente_periodo").insert({
    periodo_id: periodoId,
    materia_id: materiaId,
    grupo_id: grupoIds[0],
    docente_id: docenteId,
  });
  if (errAsignacion) throw new Error(errAsignacion.message);

  return {
    periodoId,
    periodoNombre,
    materiaId,
    grupoIds,
    disponibilidadId: disponibilidad.id as string,
    materiaIdsAislados,
    grupoIdsAislados,
  };
}

async function limpiarValido(fixture: {
  periodoId: string;
  materiaId: string;
  grupoIds: string[];
  disponibilidadId: string;
  materiaIdsAislados: string[];
  grupoIdsAislados: string[];
}) {
  const admin = adminClient();
  // Un horario exitoso pudo quedar guardado como borrador — bórralo antes que el periodo (FK sin cascade).
  await admin.from("horarios").delete().eq("periodo_id", fixture.periodoId);
  await admin.from("disponibilidad_docente").delete().eq("id", fixture.disponibilidadId);
  await admin.from("periodos").delete().eq("id", fixture.periodoId);
  await borrarMateriaYGrupos(admin, fixture.materiaId, fixture.grupoIds);
  await restaurarMateriasYGrupos(admin, fixture.materiaIdsAislados, fixture.grupoIdsAislados);
  return null;
}

// ---------------------------------------------------------------------------
// Caso 2: intentar crear horario con conflicto (debe fallar)
// ---------------------------------------------------------------------------
async function prepararPeriodoConConflicto() {
  const admin = adminClient();
  const sufijo = `CONF-${Date.now()}`;
  const sedeId = await sedeDePrueba(admin);
  const docenteId = await idDePerfilPorEmail(admin, DOCENTE_A_EMAIL);
  const { materiaIdsAislados, grupoIdsAislados } = await aislarMateriasYGrupos(admin);
  // El docente reutilizado ya tiene su propia disponibilidad real del seed;
  // hay que quitarla temporalmente o el generador encuentra otros horarios
  // libres y el conflicto deja de ser garantizado.
  const { data: dispExistente } = await admin
    .from("disponibilidad_docente")
    .select("docente_id, dia_semana, hora_inicio, hora_fin, es_tiempo_oficina")
    .eq("docente_id", docenteId);
  await admin.from("disponibilidad_docente").delete().eq("docente_id", docenteId);
  // Dos grupos distintos, mismo docente: cada uno necesita una sesión de 2h,
  // pero el docente solo tiene 30 min de disponibilidad en toda la semana —
  // ninguna de las dos sesiones cabe jamás. Falla garantizada.
  const { materiaId, grupoIds } = await crearMateriaYGrupos(admin, sufijo, sedeId, 2);

  const periodoNombre = `E2E-Periodo-${sufijo}`;
  const { data: periodo, error: errPeriodo } = await admin
    .from("periodos")
    .insert({ nombre: periodoNombre, fecha_inicio: "2026-01-01", fecha_fin: "2026-06-30", activo: true })
    .select("id")
    .single();
  if (errPeriodo) throw new Error(errPeriodo.message);
  const periodoId = periodo.id as string;

  const { data: disponibilidad, error: errDisp } = await admin
    .from("disponibilidad_docente")
    .insert({
      docente_id: docenteId,
      dia_semana: DIA_PRUEBA,
      hora_inicio: HORA_INICIO,
      hora_fin: "08:30", // 30 min: ninguna sesión de 2h del materia cabe aquí.
      es_tiempo_oficina: false,
    })
    .select("id")
    .single();
  if (errDisp) throw new Error(errDisp.message);

  for (const grupoId of grupoIds) {
    const { error } = await admin.from("asignaciones_docente_periodo").insert({
      periodo_id: periodoId,
      materia_id: materiaId,
      grupo_id: grupoId,
      docente_id: docenteId,
    });
    if (error) throw new Error(error.message);
  }

  return {
    periodoId,
    periodoNombre,
    materiaId,
    grupoIds,
    docenteId,
    disponibilidadId: disponibilidad.id as string,
    dispExistente: dispExistente ?? [],
    materiaIdsAislados,
    grupoIdsAislados,
  };
}

async function limpiarConflicto(fixture: {
  periodoId: string;
  materiaId: string;
  grupoIds: string[];
  docenteId: string;
  disponibilidadId: string;
  dispExistente: { docente_id: string; dia_semana: number; hora_inicio: string; hora_fin: string; es_tiempo_oficina: boolean }[];
  materiaIdsAislados: string[];
  grupoIdsAislados: string[];
}) {
  const admin = adminClient();
  await admin.from("horarios").delete().eq("periodo_id", fixture.periodoId);
  await admin.from("disponibilidad_docente").delete().eq("docente_id", fixture.docenteId);
  if (fixture.dispExistente.length) {
    await admin.from("disponibilidad_docente").insert(fixture.dispExistente);
  }
  await admin.from("periodos").delete().eq("id", fixture.periodoId);
  await borrarMateriaYGrupos(admin, fixture.materiaId, fixture.grupoIds);
  await restaurarMateriasYGrupos(admin, fixture.materiaIdsAislados, fixture.grupoIdsAislados);
  return null;
}

async function contarHorarios(periodoId: string) {
  const admin = adminClient();
  const { count, error } = await admin
    .from("horarios")
    .select("id", { count: "exact", head: true })
    .eq("periodo_id", periodoId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Casos 3 y 4: aula ocupada (debe bloquearse) / edición sin conflictos
// ---------------------------------------------------------------------------
async function prepararHorarioConAulaOcupada() {
  const admin = adminClient();
  const sufijo = `AULA-${Date.now()}`;
  const sedeId = await sedeDePrueba(admin);
  const docenteAId = await idDePerfilPorEmail(admin, DOCENTE_A_EMAIL);
  const docenteBId = await idDePerfilPorEmail(admin, DOCENTE_B_EMAIL);
  const [espacioAId, espacioBId, espacioLibreId] = await espaciosDePrueba(admin, sedeId, 3);
  // Dos grupos y dos docentes distintos para que el único conflicto posible
  // al reasignar el aula sea por ESPACIO, no por grupo/docente ocupado.
  const { materiaId, grupoIds } = await crearMateriaYGrupos(admin, sufijo, sedeId, 2);

  const periodoNombre = `E2E-Periodo-${sufijo}`;
  const { data: periodo, error: errPeriodo } = await admin
    .from("periodos")
    .insert({ nombre: periodoNombre, fecha_inicio: "2026-01-01", fecha_fin: "2026-06-30", activo: true })
    .select("id")
    .single();
  if (errPeriodo) throw new Error(errPeriodo.message);
  const periodoId = periodo.id as string;

  const { data: horario, error: errHorario } = await admin
    .from("horarios")
    .insert({ periodo_id: periodoId, estado: "borrador", generado_en: new Date().toISOString() })
    .select("id")
    .single();
  if (errHorario) throw new Error(errHorario.message);
  const horarioId = horario.id as string;

  const sesionBase = {
    horario_id: horarioId,
    materia_id: materiaId,
    modalidad: "presencial" as const,
    dia_semana: DIA_PRUEBA,
    hora_inicio: HORA_INICIO,
    hora_fin: HORA_FIN,
    sede_id: sedeId,
  };
  const { data: sesionA, error: errSesionA } = await admin
    .from("sesiones")
    .insert({ ...sesionBase, docente_id: docenteAId, grupo_id: grupoIds[0], espacio_id: espacioAId })
    .select("id")
    .single();
  if (errSesionA) throw new Error(errSesionA.message);

  const { data: sesionB, error: errSesionB } = await admin
    .from("sesiones")
    .insert({ ...sesionBase, docente_id: docenteBId, grupo_id: grupoIds[1], espacio_id: espacioBId })
    .select("id")
    .single();
  if (errSesionB) throw new Error(errSesionB.message);

  return {
    periodoId,
    horarioId,
    materiaId,
    grupoIds,
    sesionAId: sesionA.id as string,
    sesionBId: sesionB.id as string,
    espacioAId,
    espacioBId,
    espacioLibreId,
  };
}

async function limpiarHorario(fixture: { horarioId: string; periodoId: string; materiaId: string; grupoIds: string[] }) {
  const admin = adminClient();
  await admin.from("horarios").delete().eq("id", fixture.horarioId); // cascada: sesiones, historial_cambios
  await admin.from("periodos").delete().eq("id", fixture.periodoId);
  await borrarMateriaYGrupos(admin, fixture.materiaId, fixture.grupoIds);
  return null;
}

// El trigger proteger_horario_publicado impide eliminar o cambiar de estado un
// horario "publicado" (regla de negocio), así que limpiarHorario() no puede
// borrarlo aquí. Sin desactivar el periodo explícitamente, queda huérfano con
// activo=true y rompe cualquier página que espere un único periodo activo
// (.maybeSingle()). Las sesiones sí se pueden borrar (ese trigger se quitó).
async function limpiarHorarioPublicado(fixture: { horarioId: string; periodoId: string; materiaId: string; grupoIds: string[] }) {
  const admin = adminClient();
  await admin.from("sesiones").delete().eq("horario_id", fixture.horarioId);
  await admin.from("periodos").update({ activo: false }).eq("id", fixture.periodoId);
  await borrarMateriaYGrupos(admin, fixture.materiaId, fixture.grupoIds);
  return null;
}

// ---------------------------------------------------------------------------
// Caso 5: un horario publicado es inmutable (regresión del bug 8)
// ---------------------------------------------------------------------------
async function prepararHorarioPublicado() {
  const admin = adminClient();
  const sufijo = `PUB-${Date.now()}`;
  const sedeId = await sedeDePrueba(admin);
  const docenteId = await idDePerfilPorEmail(admin, DOCENTE_A_EMAIL);
  const [espacioId, espacioLibreId] = await espaciosDePrueba(admin, sedeId, 2);
  const { materiaId, grupoIds } = await crearMateriaYGrupos(admin, sufijo, sedeId, 1);

  const periodoNombre = `E2E-Periodo-${sufijo}`;
  const { data: periodo, error: errPeriodo } = await admin
    .from("periodos")
    .insert({ nombre: periodoNombre, fecha_inicio: "2026-01-01", fecha_fin: "2026-06-30", activo: true })
    .select("id")
    .single();
  if (errPeriodo) throw new Error(errPeriodo.message);
  const periodoId = periodo.id as string;

  const { data: horario, error: errHorario } = await admin
    .from("horarios")
    .insert({ periodo_id: periodoId, estado: "publicado", generado_en: new Date().toISOString() })
    .select("id")
    .single();
  if (errHorario) throw new Error(errHorario.message);
  const horarioId = horario.id as string;

  const { data: sesion, error: errSesion } = await admin
    .from("sesiones")
    .insert({
      horario_id: horarioId,
      materia_id: materiaId,
      docente_id: docenteId,
      grupo_id: grupoIds[0],
      espacio_id: espacioId,
      modalidad: "presencial",
      dia_semana: DIA_PRUEBA,
      hora_inicio: HORA_INICIO,
      hora_fin: HORA_FIN,
      sede_id: sedeId,
    })
    .select("id")
    .single();
  if (errSesion) throw new Error(errSesion.message);

  return { periodoId, horarioId, materiaId, grupoIds, sesionId: sesion.id as string, espacioId, espacioLibreId };
}

async function borrarMateriaPorCodigo(codigo: string) {
  const admin = adminClient();
  await admin.from("materias").delete().eq("codigo", codigo);
  return null;
}

async function borrarGrupoPorNombre(nombre: string) {
  const admin = adminClient();
  await admin.from("grupos").delete().eq("nombre", nombre);
  return null;
}

async function borrarEspacioPorNombre(nombre: string) {
  const admin = adminClient();
  await admin.from("espacios").delete().eq("nombre", nombre);
  return null;
}

async function borrarPeriodoPorNombre(nombre: string) {
  const admin = adminClient();
  await admin.from("periodos").delete().eq("nombre", nombre);
  return null;
}

async function limpiarPeriodosPaul() {
  const admin = adminClient();
  const { data, error } = await admin.from("periodos").select("id").ilike("nombre", "E2E-PERIODO-PAUL-%");
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((periodo) => periodo.id as string);
  if (ids.length) await admin.from("periodos").delete().in("id", ids);
  return null;
}

async function borrarSedePorNombre(nombre: string) {
  const admin = adminClient();
  await admin.from("sedes").delete().eq("nombre", nombre);
  return null;
}

async function horarioExiste(horarioId: string) {
  const admin = adminClient();
  const { data, error } = await admin.from("horarios").select("id").eq("id", horarioId).maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function primeraSedeYDocente() {
  const admin = adminClient();
  const sedeId = await sedeDePrueba(admin);
  const { data: sede } = await admin.from("sedes").select("nombre").eq("id", sedeId).single();
  const { data: docente } = await admin
    .from("perfiles")
    .select("id, nombre")
    .eq("rol", "docente")
    .limit(1)
    .single();
  return { sedeId, sedeNombre: sede?.nombre as string, docenteId: docente?.id as string };
}

export function registerDbTasks(on: Cypress.PluginEvents) {
  on("task", {
    "e2e:prepararPeriodoValido": prepararPeriodoValido,
    "e2e:limpiarValido": limpiarValido,
    "e2e:prepararPeriodoConConflicto": prepararPeriodoConConflicto,
    "e2e:limpiarConflicto": limpiarConflicto,
    "e2e:contarHorarios": contarHorarios,
    "e2e:prepararHorarioConAulaOcupada": prepararHorarioConAulaOcupada,
    "e2e:limpiarHorario": limpiarHorario,
    "e2e:prepararHorarioPublicado": prepararHorarioPublicado,
    "e2e:limpiarHorarioPublicado": limpiarHorarioPublicado,
    "e2e:borrarMateriaPorCodigo": borrarMateriaPorCodigo,
    "e2e:borrarGrupoPorNombre": borrarGrupoPorNombre,
    "e2e:borrarEspacioPorNombre": borrarEspacioPorNombre,
    "e2e:borrarPeriodoPorNombre": borrarPeriodoPorNombre,
    "e2e:limpiarPeriodosPaul": limpiarPeriodosPaul,
    "e2e:borrarSedePorNombre": borrarSedePorNombre,
    "e2e:horarioExiste": horarioExiste,
    "e2e:primeraSedeYDocente": primeraSedeYDocente,
  });
}
