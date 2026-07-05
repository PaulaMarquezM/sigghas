import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { HorarioPDF } from "@/lib/pdf/HorarioPDF";
import { notFound } from "next/navigation";

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

  const periodo = (horario as any).periodos;

  // 2. Obtener todas las sesiones asignadas para este horario
  const { data: sesiones, error: sesionesError } = await supabase
    .from("sesiones")
    .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
    .eq("horario_id", horarioId);

  if (sesionesError || !sesiones) {
    return new Response("Error al cargar las sesiones", { status: 500 });
  }

  // 3. Generar PDF Stream
  const stream = await renderToStream(
    React.createElement(HorarioPDF, {
      horario,
      periodo,
      sesiones,
      grupoNombre: "Reporte Completo",
    })
  );

  return new Response(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="horario-${periodo.nombre}.pdf"`,
    },
  });
}
