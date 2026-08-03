import React from "react";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import HorarioConsultasClient from "./HorarioConsultasClient";

export default async function HorarioConsultasPage() {
  await requireRol("coordinador", "administrador");

  const supabase = await createClient();

  // Obtener periodos
  const { data: periodos } = await supabase
    .from("periodos")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  // Obtener grupos
  const { data: grupos } = await supabase
    .from("grupos")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  // Obtener docentes
  const { data: docentes } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .eq("rol", "docente")
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D8D1BD] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0E1116]">
          Consulta de Horarios
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Visualiza los horarios de clases de cualquier curso o docente en los distintos periodos.
        </p>
      </div>

      <HorarioConsultasClient
        periodos={periodos || []}
        grupos={grupos || []}
        docentes={docentes || []}
      />
    </div>
  );
}
