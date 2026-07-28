"use server";

import { requireRol } from "@/lib/auth";
import { generate } from "@/lib/scheduler";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoGeneracion } from "@/lib/scheduler/types";

export async function generarHorario(periodoId: string, reemplazarBorradorId?: string | null): Promise<ResultadoGeneracion> {
  await requireRol("coordinador", "administrador");
  return generate(periodoId, reemplazarBorradorId);
}

export async function crearHorarioManual(periodoId: string) {
  await requireRol("coordinador", "administrador");
  if (!periodoId) return { exito: false, error: "Selecciona un período académico." };
  const supabase = await createClient();
  const { data: borradores } = await supabase.from("horarios").select("id").eq("periodo_id", periodoId).eq("estado", "borrador").order("generado_en", { ascending: false }).limit(1);
  if (borradores?.[0]) return { exito: true, horario_id: borradores[0].id };
  const { data, error } = await supabase.from("horarios").insert({ periodo_id: periodoId, estado: "borrador", generado_en: new Date().toISOString() }).select("id").single();
  if (error || !data) return { exito: false, error: error?.message ?? "No se pudo crear el horario manual." };
  return { exito: true, horario_id: data.id };
}

/**
 * Verifica si ya existe un horario publicado para el periodo indicado.
 * Devuelve el estado y fecha del más reciente.
 */
export async function verificarHorarioExistente(periodoId: string): Promise<{
  existe: boolean;
  id: string | null;
  estado: string | null;
  generado_en: string | null;
}> {
  await requireRol("coordinador", "administrador");
  const supabase = await createClient();

  const { data } = await supabase
    .from("horarios")
    .select("id, estado, generado_en")
    .eq("periodo_id", periodoId)
    .order("generado_en", { ascending: false })
    .limit(1);

  const horario = data?.[0] ?? null;
  return {
    existe: !!horario,
    id: horario?.id ?? null,
    estado: horario?.estado ?? null,
    generado_en: horario?.generado_en ?? null,
  };
}
