import React from "react";
import type { ComponentProps } from "react";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DisponibilidadAulas } from "@/components/horario/DisponibilidadAulas";

export default async function DisponibilidadAulasPage() {
  // Según CU07, este mapa está destinado a coordinación y personal de apoyo.
  await requireRol("coordinador", "administrador", "apoyo");

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

  let sesiones: ComponentProps<typeof DisponibilidadAulas>["sesiones"] = [];

  if (periodoActivo) {
    // 3. Un aula está ocupada si CUALQUIER horario del período activo la usa.
    // No se usa `maybeSingle()`: pueden coexistir borradores, aprobados y el
    // publicado, y todos reservan físicamente el aula mientras existen.
    const { data: horarios } = await supabase
      .from("horarios")
      .select("id")
      .eq("periodo_id", periodoActivo.id);

    const horarioRows = Array.isArray(horarios) ? horarios : horarios ? [horarios] : [];
    const horarioIds = horarioRows.map((horario) => horario.id);

    if (horarioIds.length > 0) {
      // 4. Cruzar las sesiones de todos los horarios del período activo.
      const { data } = await supabase
        .from("sesiones")
        .select("*, materias(nombre), docentes:docente_id(perfiles(nombre)), grupos!grupo_id(nombre)")
        .in("horario_id", horarioIds);
      sesiones = (data ?? []) as unknown as ComponentProps<typeof DisponibilidadAulas>["sesiones"];
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
