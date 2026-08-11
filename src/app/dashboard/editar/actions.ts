"use server";

import { requireRol } from "@/lib/auth";
import { localizeErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Elimina los horarios duplicados de un periodo, conservando únicamente
 * el más reciente (por generado_en). Antes de borrar cada duplicado,
 * elimina también sus sesiones para mantener integridad referencial.
 */
export async function limpiarDuplicadosAction(periodoId: string): Promise<{
  exito: boolean;
  eliminados: number;
  error?: string;
}> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();

  // Obtener todos los horarios del periodo ordenados de más reciente a más antiguo
  const { data: horarios, error } = await supabase
    .from("horarios")
    .select("id, estado, generado_en")
    .eq("periodo_id", periodoId)
    .order("generado_en", { ascending: false });

  if (error) {
    return { exito: false, eliminados: 0, error: localizeErrorMessage(error.message) };
  }

  if (!horarios || horarios.length <= 1) {
    return { exito: true, eliminados: 0 };
  }

  // Conservar el primero (más reciente), eliminar el resto
  const duplicados = horarios.slice(1);
  const idsDuplicados = duplicados.map((h) => h.id);

  // 1. Eliminar registros de historial_cambios (FK a horarios)
  const { error: errHistorial } = await supabase
    .from("historial_cambios")
    .delete()
    .in("horario_id", idsDuplicados);

  if (errHistorial) {
    return { exito: false, eliminados: 0, error: localizeErrorMessage(errHistorial.message) };
  }

  // 2. Eliminar sesiones (FK a horarios)
  const { error: errSesiones } = await supabase
    .from("sesiones")
    .delete()
    .in("horario_id", idsDuplicados);

  if (errSesiones) {
    return { exito: false, eliminados: 0, error: localizeErrorMessage(errSesiones.message) };
  }

  // 3. Eliminar los horarios duplicados
  const { error: errHorarios } = await supabase
    .from("horarios")
    .delete()
    .in("id", idsDuplicados);

  if (errHorarios) {
    return { exito: false, eliminados: 0, error: localizeErrorMessage(errHorarios.message) };
  }

  revalidatePath("/dashboard/editar");

  return { exito: true, eliminados: idsDuplicados.length };
}

/**
 * Elimina un horario de cualquier estado y sus sesiones/historial.
 */
export async function eliminarHorarioAction(horarioId: string): Promise<{
  exito: boolean;
  error?: string;
}> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();

  const { data: horario, error: errLookup } = await supabase
    .from("horarios")
    .select("id, estado")
    .eq("id", horarioId)
    .maybeSingle();

  if (errLookup) {
    return { exito: false, error: localizeErrorMessage(errLookup.message) };
  }

  if (!horario) {
    return { exito: false, error: "No se encontró el horario." };
  }

  const { error: errHistorial } = await supabase
    .from("historial_cambios")
    .delete()
    .eq("horario_id", horarioId);

  if (errHistorial) {
    return { exito: false, error: localizeErrorMessage(errHistorial.message) };
  }

  const { error: errSesiones } = await supabase
    .from("sesiones")
    .delete()
    .eq("horario_id", horarioId);

  if (errSesiones) {
    return { exito: false, error: localizeErrorMessage(errSesiones.message) };
  }

  const { error: errHorario } = await supabase
    .from("horarios")
    .delete()
    .eq("id", horarioId);

  if (errHorario) {
    return { exito: false, error: localizeErrorMessage(errHorario.message) };
  }

  revalidatePath("/dashboard/editar");

  return { exito: true };
}
