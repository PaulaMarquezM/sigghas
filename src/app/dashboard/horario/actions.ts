/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Obtiene el horario publicado más reciente de un periodo.
 * Usa limit(1) en lugar de single()/maybeSingle() para soportar
 * múltiples horarios por periodo sin lanzar error.
 */
async function getHorarioPublicado(supabase: any, periodoId: string) {
  const { data } = await supabase
    .from("horarios")
    .select("id, estado")
    .eq("periodo_id", periodoId)
    .eq("estado", "publicado")
    .order("generado_en", { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
}

/**
 * Obtiene las sesiones de un horario según periodo y grupo
 */
export async function getSesionesByPeriodoyGrupoAction(periodoId: string, grupoId: string) {
  const supabase = await createClient();

  // 1. Buscar el horario publicado más reciente del periodo
  const horario = await getHorarioPublicado(supabase, periodoId);

  if (!horario) {
    return { sesiones: [], horario: null };
  }

  // 2. Buscar las sesiones de ese grupo en ese horario
  const { data: sesiones } = await supabase
    .from("sesiones")
    .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
    .eq("horario_id", horario.id)
    .eq("grupo_id", grupoId);

  return {
    sesiones: sesiones || [],
    horario,
  };
}

/**
 * Obtiene las sesiones de un horario según periodo y docente
 */
export async function getSesionesByPeriodoyDocenteAction(periodoId: string, docenteId: string) {
  const supabase = await createClient();

  // 1. Buscar el horario publicado más reciente del periodo
  const horario = await getHorarioPublicado(supabase, periodoId);

  if (!horario) {
    return { sesiones: [], horario: null };
  }

  // 2. Buscar las sesiones de ese docente en ese horario
  const { data: sesiones } = await supabase
    .from("sesiones")
    .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
    .eq("horario_id", horario.id)
    .eq("docente_id", docenteId);

  return {
    sesiones: sesiones || [],
    horario,
  };
}
