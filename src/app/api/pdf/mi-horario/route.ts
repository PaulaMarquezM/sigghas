/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
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
  const { data: periodosActivos } = await supabase
    .from("periodos")
    .select("*")
    .eq("activo", true)
    .order("fecha_inicio", { ascending: false })
    .limit(1) as any;
  const periodoActivo = periodosActivos?.[0] ?? null;

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
    // Consulta por grupo específico (usada por el coordinador desde la consulta de horarios)
    if (perfil.rol !== "coordinador" && perfil.rol !== "administrador") {
      return new Response("No autorizado", { status: 403 });
    }
    const { data: grupo } = await supabase
      .from("grupos")
      .select("nombre")
      .eq("id", grupoId)
      .single();

    if (!grupo) return notFound();

    sesiones = (await getSesionesByPeriodoyGrupoAction(periodoActivo.id, grupoId)).sesiones;
    userNombre = `Curso ${grupo.nombre}`;
    userRolLabel = "Curso";
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
    // Caso Docente/Estudiante: únicamente su propio horario.
    if (perfil.rol === "estudiante") {
      const { data: matriculas } = await supabase
        .from("matriculas_estudiante")
        .select("materia_id, grupo_id")
        .eq("estudiante_id", user.id)
        .eq("periodo_id", periodoActivo.id);
      const pares = new Set(((matriculas ?? []) as Array<{ materia_id: string; grupo_id: string }>).map((m) => `${m.materia_id}:${m.grupo_id}`));
      const { data } = await supabase
        .from("sesiones")
        .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
        .eq("horario_id", horario.id);
      sesiones = ((data ?? []) as any[]).filter((sesion) => pares.has(`${sesion.materia_id}:${sesion.grupo_id}`));
      userRolLabel = "Estudiante";
    } else if (perfil.rol !== "docente") {
      return new Response("No autorizado", { status: 403 });
    } else {
      const { data } = await supabase
        .from("sesiones")
        .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
        .eq("horario_id", horario.id)
        .eq("docente_id", user.id);
      sesiones = data || [];
      userRolLabel = "Docente";
    }
    userNombre = perfil.nombre;
  }

  // 3. Generar PDF Stream
  const buffer = await renderToBuffer(
    React.createElement(MiHorarioPDF, {
      periodo: periodoActivo,
      sesiones,
      userNombre,
      userRolLabel,
    }) as any
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mi-horario.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
