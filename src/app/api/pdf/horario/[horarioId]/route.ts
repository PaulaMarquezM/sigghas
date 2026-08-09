import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth";
import { HorarioPDF } from "@/lib/pdf/HorarioPDF";
import {
  groupSesionesBySemestreSede,
  nombreArchivoHorarioPdf,
} from "@/lib/pdf/groupSesionesBySemestreSede";
import { notFound } from "next/navigation";
import type { Database } from "@/types/database";

type HorarioConPeriodo = Database["public"]["Tables"]["horarios"]["Row"] & {
  periodos: Database["public"]["Tables"]["periodos"]["Row"];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ horarioId: string }> }
) {
  // El reporte completo pertenece al módulo de consulta de coordinación.
  await requireRol("coordinador", "administrador");
  const { horarioId } = await params;

  const supabase = await createClient();

  // 1. Obtener horario y periodo
  const { data: horario, error: horarioError } = await supabase
    .from("horarios")
    .select("*, periodos(*)")
    .eq("id", horarioId)
    .single();

  if (horarioError || !horario) {
    return notFound();
  }

  const horarioConPeriodo = horario as unknown as HorarioConPeriodo;
  const periodo = horarioConPeriodo.periodos;

  // 2. Obtener todas las sesiones con semestre/sede del curso
  const { data: sesiones, error: sesionesError } = await supabase
    .from("sesiones")
    .select(
      "*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre, semestre, sede_id, sedes(nombre, es_central)), espacios(nombre)"
    )
    .eq("horario_id", horarioId);

  if (sesionesError || !sesiones) {
    return new Response("Error al cargar las sesiones", { status: 500 });
  }

  const paginas = groupSesionesBySemestreSede(sesiones);

  // 3. Generar PDF Stream
  const document = React.createElement(HorarioPDF, {
    horario,
    periodo,
    paginas,
  }) as unknown as React.ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(document);
  const filename = nombreArchivoHorarioPdf(periodo.nombre, horarioConPeriodo.estado);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
