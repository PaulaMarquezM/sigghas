import React from "react";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSesionesByPeriodoyGrupoAction } from "../actions";
import { HorarioReadOnly } from "@/components/horario/HorarioReadOnly";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Edit } from "lucide-react";

interface GrupoHorarioPageProps {
  params: Promise<{ grupoId: string }>;
}

export default async function GrupoHorarioPage({ params }: GrupoHorarioPageProps) {
  await requireRol("coordinador", "administrador");

  const { grupoId } = await params;
  const supabase = await createClient();

  // 1. Obtener periodo activo
  const { data: periodoActivo } = await supabase
    .from("periodos")
    .select("*")
    .eq("activo", true)
    .maybeSingle();

  if (!periodoActivo) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-950 p-5 rounded-lg">
        No hay un periodo académico activo registrado. Por favor, active uno en la sección de Periodos.
      </div>
    );
  }

  // 2. Obtener sesiones
  const { sesiones, horario } = await getSesionesByPeriodoyGrupoAction(periodoActivo.id, grupoId);

  // 3. Obtener grupo
  const { data: grupo } = await supabase
    .from("grupos")
    .select("*")
    .eq("id", grupoId)
    .single();

  if (!grupo) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8D1BD] pb-5">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/horario" className="text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0E1116]">
              Horario del Curso: {grupo.nombre}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Periodo Académico Activo: <span className="font-semibold text-gray-800">{periodoActivo.nombre}</span>
            </p>
          </div>
        </div>

        {horario && (
          <div className="flex items-center gap-2">
            <a
              href={`/api/pdf/horario/${horario.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="s-btn s-btn-ghost flex items-center gap-2 border-[#C7BFA6] hover:bg-[#EFEAD9] py-2 px-4 text-xs"
            >
              <FileText className="w-4 h-4 text-gray-600" />
              <span>Descargar PDF</span>
            </a>

            {horario.estado !== "publicado" && (
              <Link
                href={`/dashboard/editar/${horario.id}`}
                className="s-btn s-btn-primary flex items-center gap-2 bg-[#0E1116] hover:bg-[#1D3FD9] text-white py-2 px-4 rounded-lg text-xs"
              >
                <Edit className="w-4 h-4" />
                <span>Editar Horario</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {sesiones.length > 0 ? (
        <HorarioReadOnly
          sesiones={sesiones}
          title={`Horario de ${grupo.nombre}`}
          subtitle={`Semestre ${grupo.semestre} | Periodo: ${periodoActivo.nombre}`}
        />
      ) : (
        <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
          No se encontraron clases asignadas para este grupo en el periodo activo.
        </div>
      )}
    </div>
  );
}
