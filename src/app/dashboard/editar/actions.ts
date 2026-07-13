"use server";

import { requireRol } from "@/lib/auth";
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
    return { exito: false, eliminados: 0, error: error.message };
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
    return { exito: false, eliminados: 0, error: errHistorial.message };
  }

  // 2. Eliminar sesiones (FK a horarios)
  const { error: errSesiones } = await supabase
    .from("sesiones")
    .delete()
    .in("horario_id", idsDuplicados);

  if (errSesiones) {
    return { exito: false, eliminados: 0, error: errSesiones.message };
  }

  // 3. Eliminar los horarios duplicados
  const { error: errHorarios } = await supabase
    .from("horarios")
    .delete()
    .in("id", idsDuplicados);

  if (errHorarios) {
    return { exito: false, eliminados: 0, error: errHorarios.message };
  }

  revalidatePath("/dashboard/editar");

  return { exito: true, eliminados: idsDuplicados.length };
}
