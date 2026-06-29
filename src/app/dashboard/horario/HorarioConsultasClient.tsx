"use client";

import React, { useState, useEffect, useTransition } from "react";
import { HorarioFilters } from "@/components/horario/HorarioFilters";
import { HorarioReadOnly } from "@/components/horario/HorarioReadOnly";
import { getSesionesByPeriodoyGrupoAction, getSesionesByPeriodoyDocenteAction } from "./actions";
import { Loader2, Edit, FileText } from "lucide-react";
import Link from "next/link";

interface HorarioConsultasClientProps {
  periodos: any[];
  grupos: any[];
  docentes?: any[];
}

export default function HorarioConsultasClient({
  periodos,
  grupos,
  docentes = [],
}: HorarioConsultasClientProps) {
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>("");
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [horario, setHorario] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  // Load sessions when period, group or docente selection changes
  useEffect(() => {
    if (!selectedPeriodoId) {
      setSesiones([]);
      setHorario(null);
      return;
    }

    if (!selectedGrupoId && !selectedDocenteId) {
      setSesiones([]);
      setHorario(null);
      return;
    }

    startTransition(async () => {
      if (selectedGrupoId) {
        const res = await getSesionesByPeriodoyGrupoAction(selectedPeriodoId, selectedGrupoId);
        setSesiones(res.sesiones);
        setHorario(res.horario);
      } else if (selectedDocenteId) {
        const res = await getSesionesByPeriodoyDocenteAction(selectedPeriodoId, selectedDocenteId);
        setSesiones(res.sesiones);
        setHorario(res.horario);
      }
    });
  }, [selectedPeriodoId, selectedGrupoId, selectedDocenteId]);

  const pdfUrl = selectedGrupoId
    ? `/api/pdf/mi-horario?grupoId=${selectedGrupoId}`
    : `/api/pdf/mi-horario?docenteId=${selectedDocenteId}`;

  const viewTitle = selectedGrupoId
    ? `Grupo: ${grupos.find((g) => g.id === selectedGrupoId)?.nombre}`
    : `Docente: ${docentes.find((d) => d.id === selectedDocenteId)?.nombre}`;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <HorarioFilters
        periodos={periodos}
        grupos={grupos}
        docentes={docentes}
        selectedPeriodoId={selectedPeriodoId}
        selectedGrupoId={selectedGrupoId}
        selectedDocenteId={selectedDocenteId}
        onChangePeriodo={setSelectedPeriodoId}
        onChangeGrupo={setSelectedGrupoId}
        onChangeDocente={setSelectedDocenteId}
      />

      {/* Acciones del horario seleccionado */}
      {horario && (selectedGrupoId || selectedDocenteId) && (
        <div className="flex justify-end gap-3">
          {/* Descargar PDF */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="s-btn s-btn-ghost flex items-center gap-2 border-[#C7BFA6] hover:bg-[#EFEAD9] py-2 px-4 rounded-lg text-xs"
          >
            <FileText className="w-4 h-4 text-gray-600" />
            <span>Descargar PDF</span>
          </a>

          {/* Editar (si es borrador) */}
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

      {/* Visualización */}
      {isPending ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Cargando horario...</p>
        </div>
      ) : selectedPeriodoId && (selectedGrupoId || selectedDocenteId) ? (
        sesiones.length > 0 ? (
          <HorarioReadOnly
            sesiones={sesiones}
            title={viewTitle}
            subtitle={`Periodo Académico: ${periodos.find((p) => p.id === selectedPeriodoId)?.nombre} | Estado: ${horario?.estado.toUpperCase()}`}
          />
        ) : (
          <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
            No se encontraron clases programadas para esta selección en el periodo seleccionado.
          </div>
        )
      ) : (
        <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
          Seleccione un periodo y un filtro (grupo o docente) para ver el horario.
        </div>
      )}
    </div>
  );
}
