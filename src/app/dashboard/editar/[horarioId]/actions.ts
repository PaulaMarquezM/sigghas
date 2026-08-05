/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth";
import { requireRolAndAdminClient } from "@/lib/supabase/admin";
import type { ContextoProgramacion, Asignacion, Conflicto, DocenteConDisponibilidad } from "@/lib/scheduler/types";
import { CONFIG_DEFAULT } from "@/lib/scheduler/types";
import { validarCandidato } from "@/lib/scheduler/greedy";
import { revalidatePath } from "next/cache";

/**
 * Obtiene el contexto completo de programación y sesiones para un horario dado
 */
export async function getHorarioEditorData(horarioId: string) {
  const { admin: supabase } = await requireRolAndAdminClient("coordinador", "administrador");

  // 1. Obtener horario y periodo
  const { data: horario, error: horarioError } = await supabase
    .from("horarios")
    .select("*, periodos(*)")
    .eq("id", horarioId)
    .single();

  if (horarioError || !horario) {
    throw new Error("Horario no encontrado");
  }

  const periodo = (horario as any).periodos;

  // 2. Obtener sesiones actuales
  const { data: sesionesRaw, error: sesionesError } = await supabase
    .from("sesiones")
    .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
    .eq("horario_id", horarioId);

  if (sesionesError) {
    throw new Error(`Error al obtener sesiones: ${sesionesError.message}`);
  }

  // 3. Obtener todas las entidades para el validador
  const [materiasRes, gruposRes, espaciosRes, docentesRaw] = await Promise.all([
    supabase.from("materias").select("*"),
    supabase.from("grupos").select("*").eq("activo", true),
    supabase.from("espacios").select("*").eq("disponible", true),
    supabase.from("docentes").select("*, perfiles(nombre), disponibilidad_docente(*), docente_sedes(sede_id)")
  ]);

  const materias = materiasRes.data || [];
  const grupos = gruposRes.data || [];
  const espacios = espaciosRes.data || [];

  const docentes: DocenteConDisponibilidad[] = ((docentesRaw.data ?? []) as any[]).map((d) => ({
    id: d.id,
    tipo_contrato: d.tipo_contrato ?? "por_horas",
    hora_entrada: d.hora_entrada ?? null,
    hora_salida: d.hora_salida ?? null,
    max_horas_semana: d.max_horas_semana ?? 20,
    sede_principal_id: d.sede_principal_id ?? null,
    sede_ids: (d.docente_sedes ?? []).length
      ? d.docente_sedes.map((sede: { sede_id: string }) => sede.sede_id)
      : d.sede_principal_id ? [d.sede_principal_id] : [],
    disponibilidad: (d.disponibilidad_docente ?? []).map((dd: any) => ({
      dia_semana: dd.dia_semana,
      hora_inicio: dd.hora_inicio.slice(0, 5),
      hora_fin: dd.hora_fin.slice(0, 5),
      es_tiempo_oficina: dd.es_tiempo_oficina ?? false,
    })),
  }));

  const ctx: ContextoProgramacion = {
    periodo: periodo as any,
    materias: materias as any,
    grupos: grupos as any,
    docentes,
    espacios: espacios as any,
    horario_id: horarioId,
    config: CONFIG_DEFAULT,
  };

  // Convertir sesionesRaw a Asignacion[]
  const asignaciones: Asignacion[] = (sesionesRaw || []).map((s: any) => ({
    id: s.id,
    horario_id: s.horario_id,
    materia_id: s.materia_id,
    docente_id: s.docente_id,
    grupo_id: s.grupo_id,
    espacio_id: s.espacio_id,
    modalidad: s.modalidad,
    dia_semana: s.dia_semana,
    hora_inicio: s.hora_inicio.slice(0, 5), // '07:00:00' -> '07:00'
    hora_fin: s.hora_fin.slice(0, 5),
    sede_id: s.sede_id,
  }));

  return {
    horario: horario as any,
    periodo: periodo as any,
    sesiones: sesionesRaw as any[],
    contexto: ctx,
    asignaciones,
    espaciosDisponibles: espacios,
    opcionesManuales: {
      materias: materias.map((materia: any) => ({ id: materia.id, nombre: materia.nombre, semestre: materia.semestre, modalidad: materia.modalidad })),
      cursos: grupos.map((grupo: any) => ({ id: grupo.id, nombre: grupo.nombre, semestre: grupo.semestre, sede_id: grupo.sede_id })),
      docentes: ((docentesRaw.data ?? []) as any[]).map((docente) => ({ id: docente.id, nombre: docente.perfiles?.nombre ?? "Docente sin nombre" })),
      aulas: espacios.map((espacio: any) => ({ id: espacio.id, nombre: espacio.nombre, sede_id: espacio.sede_id })),
    },
  };
}

export type NuevaSesionInput = {
  materia_id: string;
  grupo_id: string;
  docente_id: string;
  espacio_id: string | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

export async function crearSesionManualAction(horarioId: string, input: NuevaSesionInput) {
  const { perfil, admin: supabase } = await requireRolAndAdminClient("coordinador", "administrador");
  const usuarioId = perfil.id;
  if (!input.materia_id || !input.grupo_id || !input.docente_id || !input.hora_inicio || !input.hora_fin) {
    return { exito: false, error: "Completa materia, curso, docente, día y horas." };
  }
  if (input.hora_inicio >= input.hora_fin) return { exito: false, error: "La hora de fin debe ser posterior a la hora de inicio." };

  const data = await getHorarioEditorData(horarioId);
  const materia = data.contexto.materias.find((item) => item.id === input.materia_id);
  const curso = data.contexto.grupos.find((item) => item.id === input.grupo_id);
  const aula = data.contexto.espacios.find((item) => item.id === input.espacio_id);
  if (!materia || !curso) return { exito: false, error: "La materia o el curso seleccionado ya no está disponible." };
  const modalidad = materia.modalidad;
  const espacioId = modalidad === "presencial" ? input.espacio_id : null;
  if (modalidad === "presencial" && !espacioId) return { exito: false, error: "Selecciona un aula para la clase presencial." };

  const candidato = {
    materia_id: input.materia_id,
    grupo_id: input.grupo_id,
    docente_id: input.docente_id,
    espacio_id: espacioId,
    modalidad,
    dia: input.dia_semana as any,
    hora_inicio: input.hora_inicio,
    hora_fin: input.hora_fin,
    sede_id: aula?.sede_id ?? curso.sede_id,
  };
  const validacion = validarCandidato(candidato, data.contexto, data.asignaciones);
  if (!validacion.valida) return { exito: false, error: validacion.conflicto.mensaje };

  const { data: sesion, error } = await supabase.from("sesiones").insert({
    horario_id: horarioId,
    materia_id: input.materia_id,
    grupo_id: input.grupo_id,
    docente_id: input.docente_id,
    espacio_id: espacioId,
    modalidad,
    dia_semana: input.dia_semana,
    hora_inicio: input.hora_inicio,
    hora_fin: input.hora_fin,
    sede_id: candidato.sede_id,
  }).select("id").single();
  if (error || !sesion) return { exito: false, error: error?.message ?? "No se pudo crear la clase." };
  await supabase.from("historial_cambios").insert({ sesion_id: sesion.id, horario_id: horarioId, usuario_id: usuarioId, accion: "creacion", detalle: input });
  revalidatePath(`/dashboard/editar/${horarioId}`);
  return { exito: true };
}

export async function editarSesionManualAction(horarioId: string, sesionId: string, input: NuevaSesionInput) {
  const { perfil, admin: supabase } = await requireRolAndAdminClient("coordinador", "administrador");
  if (!input.materia_id || !input.grupo_id || !input.docente_id || !input.hora_inicio || !input.hora_fin) return { exito: false, error: "Completa todos los campos obligatorios." };
  if (input.hora_inicio >= input.hora_fin) return { exito: false, error: "La hora de fin debe ser posterior a la hora de inicio." };

  const { data: anterior } = await supabase.from("sesiones").select("*").eq("id", sesionId).eq("horario_id", horarioId).maybeSingle();
  if (!anterior) return { exito: false, error: "La clase que intentas editar no existe en este horario." };
  const data = await getHorarioEditorData(horarioId);
  const materia = data.contexto.materias.find((item) => item.id === input.materia_id);
  const curso = data.contexto.grupos.find((item) => item.id === input.grupo_id);
  const docente = data.contexto.docentes.find((item) => item.id === input.docente_id);
  const aula = data.contexto.espacios.find((item) => item.id === input.espacio_id);
  if (!materia || !curso || !docente) return { exito: false, error: "La materia, curso o docente seleccionado ya no está disponible." };
  if (materia.semestre !== curso.semestre) return { exito: false, error: "La materia y el curso deben pertenecer al mismo semestre." };
  const espacioId = materia.modalidad === "presencial" ? input.espacio_id : null;
  if (materia.modalidad === "presencial" && !espacioId) return { exito: false, error: "Selecciona un aula para la clase presencial." };
  const candidato = { materia_id: materia.id, grupo_id: curso.id, docente_id: docente.id, espacio_id: espacioId, modalidad: materia.modalidad, dia: input.dia_semana as any, hora_inicio: input.hora_inicio, hora_fin: input.hora_fin, sede_id: aula?.sede_id ?? curso.sede_id };
  const validacion = validarCandidato(candidato, data.contexto, data.asignaciones.filter((item) => item.id !== sesionId));
  if (!validacion.valida) return { exito: false, error: validacion.conflicto.mensaje };
  const { error } = await supabase.from("sesiones").update({ materia_id: materia.id, grupo_id: curso.id, docente_id: docente.id, espacio_id: espacioId, modalidad: materia.modalidad, dia_semana: input.dia_semana, hora_inicio: input.hora_inicio, hora_fin: input.hora_fin, sede_id: candidato.sede_id }).eq("id", sesionId).eq("horario_id", horarioId);
  if (error) return { exito: false, error: error.message };
  await supabase.from("historial_cambios").insert({ sesion_id: sesionId, horario_id: horarioId, usuario_id: perfil.id, accion: "edicion", detalle: { antes: anterior, despues: candidato } });
  revalidatePath(`/dashboard/editar/${horarioId}`);
  return { exito: true };
}

export async function eliminarSesionManualAction(horarioId: string, sesionId: string) {
  const { perfil, admin: supabase } = await requireRolAndAdminClient("coordinador", "administrador");
  const { data: sesion } = await supabase.from("sesiones").select("*").eq("id", sesionId).eq("horario_id", horarioId).maybeSingle();
  if (!sesion) return { exito: false, error: "La clase que intentas eliminar no existe en este horario." };
  const { error: historialError } = await supabase.from("historial_cambios").insert({ sesion_id: sesionId, horario_id: horarioId, usuario_id: perfil.id, accion: "eliminacion", detalle: { sesion } });
  if (historialError) return { exito: false, error: `No se pudo registrar el cambio: ${historialError.message}` };
  const { error } = await supabase.from("sesiones").delete().eq("id", sesionId).eq("horario_id", horarioId);
  if (error) return { exito: false, error: error.message };
  revalidatePath(`/dashboard/editar/${horarioId}`);
  return { exito: true };
}

/**
 * Valida un movimiento específico de una sesión antes de guardarlo
 */
export async function validarMovimientoAction(
  contexto: ContextoProgramacion,
  asignaciones: Asignacion[],
  sesionId: string,
  updates: { dia_semana: number; hora_inicio: string; hora_fin: string; espacio_id: string | null }
): Promise<{ valida: boolean; conflicto?: Conflicto }> {
  await requireRol("coordinador", "administrador");
  // Inicializar reglas

  // Buscar asignación actual
  const asignacionIndex = asignaciones.findIndex((a) => a.id === sesionId);
  if (asignacionIndex === -1) {
    return { valida: false, conflicto: { regla: "Sistema", codigo: "SYS", tipo: "error", mensaje: "Asignación no encontrada" } };
  }

  const asignacionActual = asignaciones[asignacionIndex];

  // Crear candidato con las actualizaciones
  const candidato = {
    materia_id: asignacionActual.materia_id,
    grupo_id: asignacionActual.grupo_id,
    dia: updates.dia_semana as any,
    hora_inicio: updates.hora_inicio,
    hora_fin: updates.hora_fin,
    docente_id: asignacionActual.docente_id,
    espacio_id: updates.espacio_id,
    sede_id: asignacionActual.sede_id,
    modalidad: asignacionActual.modalidad,
  };

  // Filtrar la asignación actual de la lista de asignadas para evitar auto-conflicto
  const otrasAsignaciones = asignaciones.filter((a) => a.id !== sesionId);

  const res = validarCandidato(candidato, contexto, otrasAsignaciones);
  if (res.valida) {
    return { valida: true };
  } else {
    return { valida: false, conflicto: res.conflicto };
  }
}

/**
 * Valida todo el horario para encontrar todos los conflictos activos
 */
export async function obtenerTodosConflictosAction(
  contexto: ContextoProgramacion,
  asignaciones: Asignacion[]
): Promise<Conflicto[]> {
  await requireRol("coordinador", "administrador");
  const conflictos: Conflicto[] = [];

  for (let i = 0; i < asignaciones.length; i++) {
    const a = asignaciones[i];
    const candidato = {
      materia_id: a.materia_id,
      grupo_id: a.grupo_id,
      dia: a.dia_semana as any,
      hora_inicio: a.hora_inicio,
      hora_fin: a.hora_fin,
      docente_id: a.docente_id,
      espacio_id: a.espacio_id,
      sede_id: a.sede_id,
      modalidad: a.modalidad,
    };
    const otras = asignaciones.filter((_, idx) => idx !== i);
    const res = validarCandidato(candidato, contexto, otras);
    if (!res.valida && res.conflicto) {
      // Evitar duplicados idénticos en el panel de conflictos
      const yaExiste = conflictos.some(
        (c) => c.regla === res.conflicto.regla && c.mensaje === res.conflicto.mensaje
      );
      if (!yaExiste) {
        conflictos.push(res.conflicto);
      }
    }
  }

  return conflictos;
}

/**
 * Actualiza la base de datos con el nuevo bloque horario tras la validación exitosa
 */
export async function guardarMovimientoAction(
  sesionId: string,
  updates: { dia_semana: number; hora_inicio: string; hora_fin: string; espacio_id: string | null },
  horarioId: string
) {
  const { id: usuarioId } = await requireRol("coordinador", "administrador");
  const supabase = await createClient();

  const { data: horario } = await supabase.from("horarios").select("estado").eq("id", horarioId).single();
  if (!horario) return { exito: false, error: "No se encontró el horario que intentas editar." };

  // Obtener estado anterior para el historial
  const { data: anterior } = await supabase
    .from("sesiones")
    .select("*")
    .eq("id", sesionId)
    .single();

  // Actualizar sesión
  const { error } = await supabase
    .from("sesiones")
    .update({
      dia_semana: updates.dia_semana,
      hora_inicio: updates.hora_inicio,
      hora_fin: updates.hora_fin,
      espacio_id: updates.espacio_id,
    })
    .eq("id", sesionId);

  if (error) {
    return { exito: false, error: error.message };
  }

  // Registrar en historial_cambios
  if (anterior) {
    await supabase.from("historial_cambios").insert({
      sesion_id: sesionId,
      horario_id: horarioId,
      usuario_id: usuarioId,
      accion: "edicion",
      detalle: {
        antes: {
          dia_semana: anterior.dia_semana,
          hora_inicio: anterior.hora_inicio,
          hora_fin: anterior.hora_fin,
          espacio_id: anterior.espacio_id,
        },
        despues: updates,
      },
    });
  }

  revalidatePath(`/dashboard/editar/${horarioId}`);
  return { exito: true };
}

/**
 * Cambia el estado del horario a publicado
 */
export async function publicarHorarioAction(horarioId: string) {
  const { id: usuarioId } = await requireRol("coordinador", "administrador");
  const supabase = await createClient();

  const publicadoEn = new Date().toISOString();
  const { data: horario, error } = await supabase
    .from("horarios")
    .update({ estado: "publicado", aprobado_en: publicadoEn, aprobado_por: usuarioId })
    .eq("id", horarioId)
    .eq("estado", "borrador")
    .select("id")
    .maybeSingle();

  if (error) {
    return { exito: false, error: error.message };
  }
  if (!horario) {
    return { exito: false, error: "El horario no existe, ya fue publicado o no está en borrador." };
  }

  const { error: historialError } = await supabase.from("historial_cambios").insert({
    sesion_id: null,
    horario_id: horarioId,
    usuario_id: usuarioId,
    accion: "publicacion",
    detalle: { estado_anterior: "borrador", estado_nuevo: "publicado", publicado_en: publicadoEn },
  });
  if (historialError) {
    return { exito: false, error: `El horario fue publicado, pero no se pudo registrar la auditoría: ${historialError.message}` };
  }

  revalidatePath(`/dashboard/editar/${horarioId}`);
  revalidatePath("/dashboard/horario");
  return { exito: true };
}
