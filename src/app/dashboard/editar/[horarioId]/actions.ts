/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContextoProgramacion, Asignacion, Conflicto, DocenteConDisponibilidad } from "@/lib/scheduler/types";
import { CONFIG_DEFAULT } from "@/lib/scheduler/types";
import { initializeRules, validateSlot } from "@/lib/scheduler/rules/index";
import { revalidatePath } from "next/cache";

/**
 * Obtiene el contexto completo de programación y sesiones para un horario dado
 */
export async function getHorarioEditorData(horarioId: string) {
  await requireRol("coordinador");
  const supabase = createAdminClient();

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
    supabase.from("docentes").select("*, disponibilidad_docente(*)")
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
  };
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
  await requireRol("coordinador");
  // Inicializar reglas
  initializeRules({ materias: contexto.materias });

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

  const res = validateSlot(candidato, contexto, otrasAsignaciones);
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
  await requireRol("coordinador");
  initializeRules({ materias: contexto.materias });
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
    const res = validateSlot(candidato, contexto, otras);
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
  const { id: usuarioId } = await requireRol("coordinador");
  const supabase = await createClient();

  const { data: horario } = await supabase.from("horarios").select("estado").eq("id", horarioId).single();
  if (!horario || horario.estado === "publicado") return { exito: false, error: "Un horario publicado es inmutable." };

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
  await requireRol("coordinador");
  const supabase = await createClient();

  const { error } = await supabase
    .from("horarios")
    .update({ estado: "publicado" })
    .eq("id", horarioId);

  if (error) {
    return { exito: false, error: error.message };
  }

  revalidatePath(`/dashboard/editar/${horarioId}`);
  revalidatePath("/dashboard/horario");
  return { exito: true };
}
