"use client";

import React, { useState, useEffect, useTransition } from "react";
import { HorarioReadOnly } from "@/components/horario/HorarioReadOnly";
import { getSesionesByPeriodoyGrupoAction } from "../horario/actions";
import { Loader2, FileText, Users } from "lucide-react";

interface MiHorarioEstudianteClientProps {
  grupos: any[];
  periodoActivo: any;
}

export default function MiHorarioEstudianteClient({
  grupos,
  periodoActivo,
}: MiHorarioEstudianteClientProps) {
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [horario, setHorario] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedGrupoId) {
      setSesiones([]);
      setHorario(null);
      return;
    }

    startTransition(async () => {
      const res = await getSesionesByPeriodoyGrupoAction(periodoActivo.id, selectedGrupoId);
      setSesiones(res.sesiones);
      setHorario(res.horario);
    });
  }, [selectedGrupoId, periodoActivo]);

  return (
    <div className="space-y-6">
      {/* Selector de Grupo */}
      <div className="bg-[#F9F7F2] border border-[#D8D1BD] rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col gap-1 w-full md:w-72">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <span>Selecciona tu Grupo Académico</span>
          </label>
          <select
            value={selectedGrupoId}
            onChange={(e) => setSelectedGrupoId(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D3FD9]/20"
          >
            <option value="">-- Selecciona un Grupo --</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre} (Nivel {g.semestre})
              </option>
            ))}
          </select>
        </div>

        {selectedGrupoId && horario && (
          <a
            href={`/api/pdf/mi-horario?grupoId=${selectedGrupoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="s-btn s-btn-ghost flex items-center gap-2 border-[#C7BFA6] hover:bg-[#EFEAD9] py-2 px-4 text-xs w-full md:w-auto justify-center"
          >
            <FileText className="w-4 h-4 text-gray-600" />
            <span>Descargar PDF del Grupo</span>
          </a>
        )}
      </div>

      {/* Visualización */}
      {isPending ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Cargando horario...</p>
        </div>
      ) : selectedGrupoId ? (
        sesiones.length > 0 ? (
          <HorarioReadOnly
            sesiones={sesiones}
            title={`Horario de Clases - Grupo ${grupos.find((g) => g.id === selectedGrupoId)?.nombre}`}
            subtitle={`Periodo Académico: ${periodoActivo.nombre}`}
          />
        ) : (
          <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
            No se encontraron clases programadas para este grupo en el periodo activo.
          </div>
        )
      ) : (
        <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
          Selecciona tu grupo en el panel superior para visualizar el horario correspondiente.
        </div>
      )}
    </div>
  );
}
