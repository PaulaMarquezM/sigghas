import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { MiHorarioPDF } from "@/lib/pdf/MiHorarioPDF";
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
    .maybeSingle();

  if (!periodoActivo) {
    return new Response("No hay periodo activo", { status: 400 });
  }

  // 2. Obtener el horario del periodo
  const { data: horario } = await supabase
    .from("horarios")
    .select("*")
    .eq("periodo_id", periodoActivo.id)
    .maybeSingle();

  if (!horario) {
    return new Response("No hay horario para el periodo activo", { status: 404 });
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

    const { data } = await supabase
      .from("sesiones")
      .select("*, materias(nombre, codigo), perfiles:docente_id(nombre), grupos(nombre), espacios(nombre)")
      .eq("horario_id", horario.id)
      .eq("grupo_id", grupoId);

    sesiones = data || [];
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
      .select("*, materias(nombre, codigo), perfiles:docente_id(nombre), grupos(nombre), espacios(nombre)")
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
      .select("*, materias(nombre, codigo), perfiles:docente_id(nombre), grupos(nombre), espacios(nombre)")
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
    })
  );

  return new Response(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mi-horario.pdf"`,
    },
  });
}
