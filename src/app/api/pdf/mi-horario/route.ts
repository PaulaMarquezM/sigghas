/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { MiHorarioPDF } from "@/lib/pdf/MiHorarioPDF";
import { getSesionesByPeriodoyGrupoAction } from "@/app/dashboard/horario/actions";
import { notFound } from "next/navigation";

export async function GET(request: Request) {
  const { user, perfil } = await getSession();
  if (!perfil) return notFound();

  const { searchParams } = new URL(request.url);
  const grupoId = searchParams.get("grupoId");
  const docenteId = searchParams.get("docenteId");

  const supabase = await createClient();

  // 1. Obtener periodo activo
  const { data: periodoActivo } = await supabase
    .from("periodos")
    .select("*")
    .eq("activo", true)
    .maybeSingle() as any;

  if (!periodoActivo) {
    return new Response("No hay periodo activo", { status: 400 });
  }

  // 2. Obtener el horario publicado más reciente del periodo
  const { data: horariosData } = await supabase
    .from("horarios")
    .select("*")
    .eq("periodo_id", periodoActivo.id)
    .eq("estado", "publicado")
    .order("generado_en", { ascending: false })
    .limit(1) as any;

  const horario = horariosData?.[0] ?? null;

  if (!horario) {
    return new Response("No hay horario publicado para el periodo activo", { status: 404 });
  }

  let sesiones: any[] = [];
  let userNombre = perfil.nombre;
  let userRolLabel = "Docente";

  if (grupoId) {
    // Caso Estudiante: Consultando un grupo específico
    const { data: grupo } = await supabase
      .from("grupos")
      .select("nombre")
      .eq("id", grupoId)
      .single();

    if (!grupo) return notFound();

    sesiones = (await getSesionesByPeriodoyGrupoAction(periodoActivo.id, grupoId)).sesiones;
    userNombre = `Grupo ${grupo.nombre}`;
    userRolLabel = "Estudiante";
  } else if (docenteId) {
    // Caso Coordinador/Admin: Consultando un docente específico
    if (perfil.rol !== "coordinador" && perfil.rol !== "administrador" && user.id !== docenteId) {
      return new Response("No autorizado", { status: 403 });
    }

    const { data: perfilDocente } = await supabase
      .from("perfiles")
      .select("nombre")
      .eq("id", docenteId)
      .single();

    if (!perfilDocente) return notFound();

    const { data } = await supabase
      .from("sesiones")
      .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
      .eq("horario_id", horario.id)
      .eq("docente_id", docenteId);

    sesiones = data || [];
    userNombre = perfilDocente.nombre;
    userRolLabel = "Docente";
  } else {
    // Caso Docente: Consultando su propio horario
    if (perfil.rol !== "docente") {
      return new Response("No autorizado", { status: 403 });
    }

    const { data } = await supabase
      .from("sesiones")
      .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
      .eq("horario_id", horario.id)
      .eq("docente_id", user.id);

    sesiones = data || [];
    userNombre = perfil.nombre;
    userRolLabel = "Docente";
  }

  // 3. Generar PDF Stream
  const stream = await renderToStream(
    React.createElement(MiHorarioPDF, {
      periodo: periodoActivo,
      sesiones,
      userNombre,
      userRolLabel,
    }) as any
  );

  return new Response(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mi-horario.pdf"`,
    },
  });
}
