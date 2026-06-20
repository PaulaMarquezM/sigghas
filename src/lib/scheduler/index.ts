/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResultadoGeneracion, ContextoProgramacion, DocenteConDisponibilidad } from "./types";
import { CONFIG_DEFAULT } from "./types";
import { initializeRules } from "./rules/index";
import { resolverConBacktrack } from "./backtrack";
import { createClient } from "@/lib/supabase/server";

export async function generate(periodoId: string): Promise<ResultadoGeneracion> {
  const log: string[] = [];
  log.push(`Iniciando generación de horario para periodo: ${periodoId}`);
  log.push(`${new Date().toISOString()}`);

  const supabase = await createClient();

  const { data: periodo, error: periodoError } = await supabase
    .from("periodos")
    .select("*")
    .eq("id", periodoId)
    .single();

  if (periodoError || !periodo) {
    return {
      exito: false,
      horario_id: "",
      total_asignaciones: 0,
      conflictos_no_resueltos: [],
      log: [...log, "Periodo no encontrado"],
    };
  }

  const periodoData: { id: string; nombre: string; fecha_inicio: string; fecha_fin: string; activo: boolean } = periodo as any;
  log.push(`Periodo: ${periodoData.nombre}`);

  const [materiasRes, gruposRes, espaciosRes] = await Promise.all([
    supabase.from("materias").select("*"),
    supabase.from("grupos").select("*").eq("activo", true),
    supabase.from("espacios").select("*").eq("disponible", true),
  ]);

  if (!materiasRes.data || !gruposRes.data || !espaciosRes.data) {
    return {
      exito: false,
      horario_id: "",
      total_asignaciones: 0,
      conflictos_no_resueltos: [],
      log: [...log, "Error cargando entidades base"],
    };
  }

  const materias = materiasRes.data as any[];
  const grupos = gruposRes.data as any[];
  const espacios = espaciosRes.data as any[];

  log.push(`${materias.length} materias cargadas`);
  log.push(`${grupos.length} grupos activos cargados`);
  log.push(`${espacios.length} espacios disponibles cargados`);

  const { data: docentesRaw } = await supabase
    .from("docentes")
    .select("*, disponibilidad_docente(*)");

  const docentes: DocenteConDisponibilidad[] = ((docentesRaw ?? []) as any[]).map((d) => ({
    id: d.id,
    tipo_contrato: d.tipo_contrato ?? "por_horas",
    hora_entrada: d.hora_entrada ?? null,
    hora_salida: d.hora_salida ?? null,
    max_horas_semana: d.max_horas_semana ?? 20,
    sede_principal_id: d.sede_principal_id ?? null,
    disponibilidad: (d.disponibilidad_docente ?? []).map((dd: any) => ({
      dia_semana: dd.dia_semana,
      hora_inicio: dd.hora_inicio,
      hora_fin: dd.hora_fin,
      es_tiempo_oficina: dd.es_tiempo_oficina ?? false,
    })),
  }));

  log.push(`${docentes.length} docentes cargados`);

  const { data: horarioExistente } = await supabase
    .from("horarios")
    .select("*")
    .eq("periodo_id", periodoId)
    .eq("estado", "borrador")
    .maybeSingle();

  let horarioId: string;

  if (horarioExistente) {
    horarioId = (horarioExistente as any).id;
    log.push(`Horario existente encontrado: ${horarioId}`);

    await supabase.from("sesiones").delete().eq("horario_id", horarioId);
    log.push("Sesiones anteriores eliminadas para regeneración");
  } else {
    const { data: nuevoHorario } = await (supabase.from("horarios") as any)
      .insert({ periodo_id: periodoId, estado: "borrador", generado_en: new Date().toISOString() })
      .select()
      .single();

    if (!nuevoHorario) {
      return {
        exito: false,
        horario_id: "",
        total_asignaciones: 0,
        conflictos_no_resueltos: [],
        log: [...log, "Error creando horario"],
      };
    }

    horarioId = (nuevoHorario as any).id;
    log.push(`Horario creado: ${horarioId}`);
  }

  initializeRules({ materias: materias as any });

  const ctx: ContextoProgramacion = {
    periodo: periodoData as any,
    materias: materias as any,
    grupos: grupos as any,
    docentes,
    espacios: espacios as any,
    horario_id: horarioId,
    config: CONFIG_DEFAULT,
  };

  const { asignaciones, conflictos } = resolverConBacktrack(
    ctx,
    log,
    CONFIG_DEFAULT.max_intentos_backtrack
  );

  log.push(`\nResumen:`);
  log.push(`   Asignaciones creadas: ${asignaciones.length}`);
  log.push(`   Conflictos: ${conflictos.length}`);

  if (asignaciones.length > 0) {
    const sesionesParaDB = asignaciones.map((a) => ({
      horario_id: a.horario_id,
      materia_id: a.materia_id,
      docente_id: a.docente_id,
      grupo_id: a.grupo_id,
      espacio_id: a.espacio_id,
      modalidad: a.modalidad,
      dia_semana: a.dia_semana,
      hora_inicio: a.hora_inicio,
      hora_fin: a.hora_fin,
      sede_id: a.sede_id,
    }));

    const { error } = await (supabase.from("sesiones") as any).insert(sesionesParaDB);

    if (error) {
      log.push(`Error guardando sesiones: ${error.message}`);
      return {
        exito: false,
        horario_id: horarioId,
        total_asignaciones: 0,
        conflictos_no_resueltos: conflictos,
        log,
      };
    }

    log.push(`${sesionesParaDB.length} sesiones guardadas en Supabase`);

    if (conflictos.length === 0) {
      await (supabase.from("horarios") as any)
        .update({ estado: "borrador", generado_en: new Date().toISOString() })
        .eq("id", horarioId);
    }
  }

  const exito = conflictos.length === 0;

  log.push(`\n${exito ? "Horario generado exitosamente" : "Horario generado con conflictos"}`);

  return {
    exito,
    horario_id: horarioId,
    total_asignaciones: asignaciones.length,
    conflictos_no_resueltos: conflictos,
    log,
  };
}
