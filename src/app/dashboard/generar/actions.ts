"use server";

import { requireRol } from "@/lib/auth";
import { generate } from "@/lib/scheduler";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoGeneracion } from "@/lib/scheduler/types";

export async function generarHorario(periodoId: string, reemplazarBorradorId?: string | null): Promise<ResultadoGeneracion> {
  await requireRol("coordinador");
  return generate(periodoId, reemplazarBorradorId);
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
  await requireRol("coordinador");
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
