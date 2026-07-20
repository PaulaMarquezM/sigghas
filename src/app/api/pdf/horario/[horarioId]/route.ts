import React from "react";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { HorarioPDF } from "@/lib/pdf/HorarioPDF";
import { notFound } from "next/navigation";
import type { Database } from "@/types/database";

type HorarioConPeriodo = Database["public"]["Tables"]["horarios"]["Row"] & {
  periodos: Database["public"]["Tables"]["periodos"]["Row"];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ horarioId: string }> }
) {
  // Verificar autenticación
  await getSession();
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

  // 2. Obtener todas las sesiones asignadas para este horario
  const { data: sesiones, error: sesionesError } = await supabase
    .from("sesiones")
    .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
    .eq("horario_id", horarioId);

  if (sesionesError || !sesiones) {
    return new Response("Error al cargar las sesiones", { status: 500 });
  }

  // 3. Generar PDF Stream
  const document = React.createElement(HorarioPDF, {
    horario,
    periodo,
    sesiones,
    grupoNombre: "Reporte Completo",
  }) as unknown as React.ReactElement<DocumentProps>;
  const stream = await renderToStream(document);

  return new Response(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="horario-${periodo.nombre}.pdf"`,
    },
  });
}
