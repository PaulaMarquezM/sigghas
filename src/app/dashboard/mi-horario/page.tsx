/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HorarioReadOnly } from "@/components/horario/HorarioReadOnly";
import { FileText } from "lucide-react";
import MiHorarioEstudianteClient from "./MiHorarioEstudianteClient";

export default async function MiHorarioPage() {
  const { user, perfil } = await getSession();
  const supabase = await createClient();

  if (!perfil) {
    return <div>No se encontró el perfil de usuario.</div>;
  }

  // 1. Obtener periodo activo
  const { data: periodoActivo } = await supabase
    .from("periodos")
    .select("*")
    .eq("activo", true)
    .maybeSingle();

  if (!periodoActivo) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-950 p-5 rounded-lg">
        No hay un periodo académico activo registrado en el sistema.
      </div>
    );
  }

  // 2. Obtener el horario publicado más reciente del periodo activo
  // Usamos limit(1) en lugar de maybeSingle() porque puede haber múltiples horarios por periodo
  const { data: horariosPublicados } = await supabase
    .from("horarios")
    .select("*")
    .eq("periodo_id", periodoActivo.id)
    .eq("estado", "publicado")
    .order("generado_en", { ascending: false })
    .limit(1);

  const horario = horariosPublicados?.[0] ?? null;

  if (!horario) {
    // Verificar si existe algún horario (aunque no esté publicado)
    const { data: cualquierHorario } = await supabase
      .from("horarios")
      .select("estado")
      .eq("periodo_id", periodoActivo.id)
      .limit(1);

    return (
      <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
        {cualquierHorario && cualquierHorario.length > 0
          ? `El horario del periodo ${periodoActivo.nombre} aún no ha sido publicado.`
          : `No se ha generado ningún horario para el periodo académico activo (${periodoActivo.nombre}).`}
      </div>
    );
  }

  // 3. Renderizar según rol
  if (perfil.rol === "docente") {
    // Buscar sesiones de este docente en el horario activo
    const { data: sesiones } = await supabase
      .from("sesiones")
      .select("*, materias(nombre, codigo), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre), espacios(nombre)")
      .eq("horario_id", horario.id)
      .eq("docente_id", user.id);

    const hasClases = sesiones && sesiones.length > 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8D1BD] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0E1116]">
              Mi Horario de Clases
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Docente: <span className="font-semibold text-gray-800">{perfil.nombre}</span> | Periodo:{" "}
              <span className="font-semibold text-gray-800">{periodoActivo.nombre}</span>
            </p>
          </div>

          {hasClases && (
            <a
              href="/api/pdf/mi-horario"
              target="_blank"
              rel="noopener noreferrer"
              className="s-btn s-btn-ghost flex items-center gap-2 border-[#C7BFA6] hover:bg-[#EFEAD9] py-2 px-4 text-xs"
            >
              <FileText className="w-4 h-4 text-gray-600" />
              <span>Descargar PDF</span>
            </a>
          )}
        </div>

        {hasClases ? (
          <HorarioReadOnly
            sesiones={sesiones}
            title={`Horario Docente: ${perfil.nombre}`}
            subtitle={`Periodo Académico: ${periodoActivo.nombre}`}
          />
        ) : (
          <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
            No tienes clases programadas en el periodo académico activo.
          </div>
        )}
      </div>
    );
  }

  // Estudiantes: deben elegir su grupo o ver el horario del periodo
  const { data: grupos } = await supabase
    .from("grupos")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D8D1BD] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0E1116]">
          Horario de Clases
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Periodo Académico Activo: <span className="font-semibold text-gray-800">{periodoActivo.nombre}</span>
        </p>
      </div>

      <MiHorarioEstudianteClient
        grupos={grupos || []}
        periodoActivo={periodoActivo}
      />
    </div>
  );
}
