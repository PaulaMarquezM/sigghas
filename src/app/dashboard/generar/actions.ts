"use server";

import { requireRol } from "@/lib/auth";
import { generate } from "@/lib/scheduler";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoGeneracion } from "@/lib/scheduler/types";

export type CriterioGeneracion = { grupoId?: string; sedeId?: string };

export async function generarHorario(periodoId: string, reemplazarBorradorId?: string | null, criterio: CriterioGeneracion = {}): Promise<ResultadoGeneracion> {
  await requireRol("coordinador", "administrador");
  // La edición de un horario existente se realiza desde el editor manual.
  // La generación nunca crea un segundo horario para el mismo período.
  return generate(periodoId, null, criterio);
}

export async function crearHorarioManual(periodoId: string) {
  await requireRol("coordinador", "administrador");
  if (!periodoId) return { exito: false, error: "Selecciona un período académico." };
  const supabase = await createClient();
  const { data: periodo, error: periodoError } = await supabase
    .from("periodos")
    .select("id, activo")
    .eq("id", periodoId)
    .single();
  if (periodoError || !periodo) {
    return { exito: false, error: periodoError?.message ?? "No se encontr\\u00f3 el per\\u00edodo acad\\u00e9mico." };
  }
  if (!periodo.activo) {
    return { exito: false, error: "Solo se puede crear un horario para el per\\u00edodo acad\\u00e9mico activo." };
  }
  const { data: existentes } = await supabase.from("horarios").select("id, estado").eq("periodo_id", periodoId).order("generado_en", { ascending: false }).limit(1);
  if (existentes?.[0]) return { exito: false, error: "Ya existe un horario para este período. Edítalo desde el editor manual." };
  const { data, error } = await supabase.from("horarios").insert({ periodo_id: periodoId, estado: "borrador", generado_en: new Date().toISOString(), aprobado_en: null, aprobado_por: null }).select("id").single();
  if (error || !data) return { exito: false, error: error?.message ?? "No se pudo crear el horario manual." };
  return { exito: true, horario_id: data.id };
}

/** Verifica si ya existe cualquier horario para el período indicado. */
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
