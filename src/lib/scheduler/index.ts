/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "crypto";
import { requireRolAndAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolverConBacktrack } from "./backtrack";
import { CONFIG_DEFAULT, type Conflicto, type ContextoProgramacion, type DocenteConDisponibilidad, type ResultadoGeneracion } from "./types";

const fallo = (codigo: string, mensaje: string): Conflicto => ({ regla: "CONFIGURACION", codigo, tipo: "error", mensaje });

/**
 * Genera un borrador completo. No elimina ni modifica un horario existente
 * hasta haber encontrado una solución válida para todas las sesiones.
 */
export async function generate(periodoId: string, reemplazarBorradorId?: string | null, criterio: { grupoId?: string; sedeId?: string } = {}): Promise<ResultadoGeneracion> {
  const log = [`Iniciando generación para el período ${periodoId}.`];
  const sessionSupabase = await createClient();
  const { admin: supabase } = await requireRolAndAdminClient("coordinador", "administrador");
  const { data: periodo, error: periodoError } = await supabase.from("periodos").select("*").eq("id", periodoId).single();
  if (periodoError || !periodo) return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: [fallo("PERIODO_NO_ENCONTRADO", "No se encontró el período académico.")], log };
  if (!periodo.activo) return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: [fallo("PERIODO_INACTIVO", "Solo se puede generar para el período académico activo.")], log };

  const { data: horarioExistente, error: horarioExistenteError } = await supabase
    .from("horarios")
    .select("id")
    .eq("periodo_id", periodoId)
    .limit(1);
  if (horarioExistenteError) {
    return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: [fallo("ERROR_VALIDANDO_HORARIO_EXISTENTE", "No se pudo comprobar si el período ya tiene un horario." )], log };
  }
  if (horarioExistente?.[0]) {
    return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: [fallo("HORARIO_PERIODO_EXISTENTE", "Ya existe un horario para este período. Edítalo desde el editor manual.")], log: [...log, "No se creó un segundo horario para el mismo período."] };
  }

  const [materiasRes, gruposRes, espaciosRes, docentesRes, asignacionesRes, disponibilidadEspaciosRes, sedesRes] = await Promise.all([
    supabase.from("materias").select("*").eq("activo", true),
    supabase.from("grupos").select("*").eq("activo", true),
    supabase.from("espacios").select("*").eq("activo", true).eq("disponible", true),
    supabase.from("docentes").select("*, perfiles(nombre), disponibilidad_docente(*), docente_sedes(sede_id)"),
    supabase.from("asignaciones_docente_periodo").select("periodo_id, materia_id, grupo_id, docente_id").eq("periodo_id", periodoId),
    supabase.from("disponibilidad_espacio").select("espacio_id, dia_semana, hora_inicio, hora_fin, disponible"),
    supabase.from("sedes").select("id, nombre"),
  ]);
  if (materiasRes.error || gruposRes.error || espaciosRes.error || docentesRes.error || asignacionesRes.error || disponibilidadEspaciosRes.error || sedesRes.error) {
    return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: [fallo("ERROR_CARGANDO_DATOS", "No se pudieron cargar todos los datos de configuración del horario.")], log: [...log, "Error cargando datos: revisa que la migración 009 esté aplicada."] };
  }
  let materias = materiasRes.data ?? [];
  let grupos = gruposRes.data ?? [];
  if (criterio.grupoId) grupos = grupos.filter((grupo) => grupo.id === criterio.grupoId);
  if (criterio.sedeId) grupos = grupos.filter((grupo) => grupo.sede_id === criterio.sedeId);
  if (!grupos.length) return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: [fallo("CRITERIO_SIN_RESULTADOS", "El criterio seleccionado no tiene cursos activos para generar.")], log };
  const materiasConCurso = new Set(grupos.map((grupo) => grupo.semestre));
  materias = materias.filter((materia) => materiasConCurso.has(materia.semestre));
  const espacios = espaciosRes.data ?? [];
  const docentes: DocenteConDisponibilidad[] = ((docentesRes.data ?? []) as any[]).map((docente) => ({
    id: docente.id,
    nombre: docente.perfiles?.nombre?.trim() || "Docente sin nombre",
    tipo_contrato: docente.tipo_contrato,
    hora_entrada: docente.hora_entrada,
    hora_salida: docente.hora_salida,
    max_horas_semana: docente.max_horas_semana,
    sede_principal_id: docente.sede_principal_id,
    sede_ids: (docente.docente_sedes ?? []).length
      ? docente.docente_sedes.map((sede: { sede_id: string }) => sede.sede_id)
      : docente.sede_principal_id ? [docente.sede_principal_id] : [],
    disponibilidad: (docente.disponibilidad_docente ?? []).map((bloque: any) => ({
      dia_semana: bloque.dia_semana,
      hora_inicio: bloque.hora_inicio.slice(0, 5),
      hora_fin: bloque.hora_fin.slice(0, 5),
      es_tiempo_oficina: bloque.es_tiempo_oficina,
    })),
  }));
  log.push(`${materias.length} materias activas, ${grupos.length} cursos activos y ${espacios.length} aulas habilitadas${criterio.grupoId || criterio.sedeId ? " para el criterio seleccionado" : ""}.`);

  const conflictosConfiguracion: Conflicto[] = [];
  for (const materia of materias) {
    const horas = Number(materia.horas_semana);
    if (!(horas > 0 && horas <= 6 && Number.isInteger(horas * 2) && Number(materia.horas_teoria) + Number(materia.horas_practica) === horas)) {
      conflictosConfiguracion.push({ ...fallo("HORAS_MATERIA_INVALIDAS", `La materia ${materia.codigo} debe sumar de 0,5 a 6 horas semanales.`), materia_id: materia.id });
    }
    if (materia.modalidad !== "presencial" && materia.requiere_laboratorio) {
      conflictosConfiguracion.push({ ...fallo("MODALIDAD_LABORATORIO_CONTRADICTORIA", `La materia ${materia.codigo} es ${materia.modalidad} y no puede requerir laboratorio.`), materia_id: materia.id });
    }
  }
  if (conflictosConfiguracion.length) return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: conflictosConfiguracion, log };

  const docentesAsignados = new Set((asignacionesRes.data ?? []).map((asignacion) => `${asignacion.materia_id}:${asignacion.grupo_id}`));
  const faltantesDocente = materias.flatMap((materia) => grupos
    .filter((grupo) => grupo.semestre === materia.semestre)
    .filter((grupo) => !docentesAsignados.has(`${materia.id}:${grupo.id}`))
    .map((grupo) => ({ regla: "CONFIGURACION", codigo: "DOCENTE_SIN_ASIGNAR", tipo: "error" as const, mensaje: `La materia ${materia.codigo} ${materia.nombre} no tiene docente asignado para el grupo ${grupo.nombre} en este período.`, materia_id: materia.id, grupo_id: grupo.id })));
  if (faltantesDocente.length) return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: 0, sesiones_generadas: 0, conflictos_no_resueltos: faltantesDocente, log: [...log, `Faltan ${faltantesDocente.length} asignaciones docente–materia–grupo.`] };

  const ctx: ContextoProgramacion = {
    periodo,
    materias,
    grupos,
    docentes,
    espacios,
    sedes: sedesRes.data ?? [],
    asignaciones_docente: asignacionesRes.data ?? [],
    disponibilidad_espacio: (disponibilidadEspaciosRes.data ?? []).map((bloque) => ({ ...bloque, dia_semana: bloque.dia_semana as 1 | 2 | 3 | 4 | 5 | 6, hora_inicio: bloque.hora_inicio.slice(0, 5), hora_fin: bloque.hora_fin.slice(0, 5) })),
    horario_id: "",
    config: CONFIG_DEFAULT,
  };
  const resultado = resolverConBacktrack(ctx, log);
  const esperadas = materias.reduce((total, materia) => total + grupos.filter((grupo) => grupo.semestre === materia.semestre).length * (Number(materia.horas_semana) <= 3.5 ? 1 : 2), 0);
  if (!resultado.exito || resultado.asignaciones.length !== esperadas) {
    return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: esperadas, sesiones_generadas: 0, conflictos_no_resueltos: resultado.conflictos, log: [...log, "No se guardó ningún cambio: el horario no está completo."] };
  }

  const compartidas = new Map<string, typeof resultado.asignaciones>();
  for (const asignacion of resultado.asignaciones) {
    const clave = asignacion.modalidad === "presencial" ? randomUUID() : `${asignacion.materia_id}:${asignacion.docente_id}:${asignacion.dia_semana}:${asignacion.hora_inicio}:${asignacion.hora_fin}:${asignacion.modalidad}`;
    compartidas.set(clave, [...(compartidas.get(clave) ?? []), asignacion]);
  }
  const sesiones = [...compartidas.values()].map((iguales) => {
    const principal = iguales[0];
    return { id: randomUUID(), ...principal, grupos_compartidos: iguales.slice(1).map((asignacion) => asignacion.grupo_id) };
  });
  const { data: horarioId, error: guardadoError } = await (sessionSupabase as any).rpc("guardar_horario_generado", {
    p_periodo_id: periodoId,
    p_sesiones: sesiones,
    p_reemplazar_borrador_id: reemplazarBorradorId ?? null,
  });
  if (guardadoError || !horarioId) return { exito: false, horario_id: "", total_asignaciones: 0, sesiones_esperadas: esperadas, sesiones_generadas: 0, conflictos_no_resueltos: [fallo("ERROR_GUARDANDO", guardadoError?.message ?? "No se pudo guardar el borrador generado.")], log };
  log.push(`Horario completo guardado como borrador (${sesiones.length} sesiones físicas/lógicas; ${esperadas} visibles por grupo).`);
  return { exito: true, horario_id: horarioId, total_asignaciones: sesiones.length, sesiones_esperadas: esperadas, sesiones_generadas: esperadas, conflictos_no_resueltos: [], log };
}
