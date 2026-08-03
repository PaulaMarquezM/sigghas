/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

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

async function getSesionesGrupo(supabase: any, horarioId: string, grupoId: string) {
  const [directas, compartidas] = await Promise.all([
    supabase.from("sesiones")
      .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
      .eq("horario_id", horarioId).eq("grupo_id", grupoId),
    supabase.from("sesiones_grupos_compartidos")
      .select("sesiones!inner(*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), espacios(nombre))")
      .eq("grupo_id", grupoId).eq("sesiones.horario_id", horarioId),
  ]);
  const adicionales = (compartidas.data ?? []).map((fila: any) => ({
    ...fila.sesiones,
    grupo_id: grupoId,
    grupos: { nombre: "Curso compartido" },
  }));
  return [...(directas.data ?? []), ...adicionales];
}

/**
 * Obtiene las sesiones de un horario según periodo y grupo
 */
export async function getSesionesByPeriodoyGrupoAction(periodoId: string, grupoId: string) {
  await getSession();
  const supabase = await createClient();

  // 1. Buscar el horario publicado más reciente del periodo
  const horario = await getHorarioPublicado(supabase, periodoId);

  if (!horario) {
    return { sesiones: [], horario: null };
  }

  // 2. Buscar las sesiones de ese grupo en ese horario
  const sesiones = await getSesionesGrupo(supabase, horario.id, grupoId);

  return {
    sesiones,
    horario,
  };
}

/**
 * Obtiene las sesiones de un horario según periodo y docente
 */
export async function getSesionesByPeriodoyDocenteAction(periodoId: string, docenteId: string) {
  const { user, perfil } = await getSession();
  if (perfil?.rol === "docente" && user.id !== docenteId) {
    throw new Error("No autorizado para consultar el horario de otro docente.");
  }
  if (!perfil || !["coordinador", "administrador", "docente"].includes(perfil.rol)) {
    throw new Error("No autorizado para consultar horarios docentes.");
  }
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
