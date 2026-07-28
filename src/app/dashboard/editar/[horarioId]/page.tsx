import React from "react";
import { requireRol } from "@/lib/auth";
import { getHorarioEditorData } from "./actions";
import HorarioEditor from "./HorarioEditor";

interface EditarHorarioPageProps {
  params: Promise<{ horarioId: string }>;
}

export default async function EditarHorarioPage({ params }: EditarHorarioPageProps) {
  await requireRol("coordinador", "administrador");

  const { horarioId } = await params;
  const data = await getHorarioEditorData(horarioId);

  return (
    <div className="container mx-auto px-4 py-8">
      <HorarioEditor
        horario={data.horario}
        periodo={data.periodo}
        initialAsignaciones={data.asignaciones}
        initialSesiones={data.sesiones}
        contexto={data.contexto}
        espaciosDisponibles={data.espaciosDisponibles}
        opcionesManuales={data.opcionesManuales}
      />
    </div>
  );
}
