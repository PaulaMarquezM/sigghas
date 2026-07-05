import React from "react";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DisponibilidadAulas } from "@/components/horario/DisponibilidadAulas";

export default async function DisponibilidadAulasPage() {
  // Permitido para coordinador, administrador y apoyo
  await requireRol("coordinador", "administrador", "apoyo", "docente");

  const supabase = await createClient();

  // 1. Obtener todos los espacios (aulas y laboratorios)
  const { data: espacios } = await supabase
    .from("espacios")
    .select("*")
    .eq("disponible", true)
    .order("nombre");

  // 2. Obtener periodo activo
  const { data: periodoActivo } = await supabase
    .from("periodos")
    .select("*")
    .eq("activo", true)
    .maybeSingle();

  let sesiones: any[] = [];

  if (periodoActivo) {
    // 3. Obtener el horario del periodo activo
    const { data: horario } = await supabase
      .from("horarios")
      .select("id")
      .eq("periodo_id", periodoActivo.id)
      .maybeSingle();

    if (horario) {
      // 4. Obtener todas las sesiones de este horario para cruzar disponibilidad
      const { data } = await supabase
        .from("sesiones")
        .select("*, materias(nombre), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre)")
        .eq("horario_id", horario.id);
      sesiones = data || [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D8D1BD] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0E1116]">
          Mapa de Disponibilidad de Aulas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Consulta en tiempo real qué aulas y laboratorios se encuentran libres u ocupados en un bloque horario.
        </p>
      </div>

      <DisponibilidadAulas
        espacios={espacios || []}
        sesiones={sesiones}
      />
    </div>
  );
}
