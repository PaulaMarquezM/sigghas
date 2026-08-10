"use client";

import React, { useState, useEffect, useTransition } from "react";
import { HorarioFilters, type HorarioFiltroModo } from "@/components/horario/HorarioFilters";
import { HorarioReadOnly } from "@/components/horario/HorarioReadOnly";
import {
  getSesionesByPeriodoyGrupoAction,
  getSesionesByPeriodoyDocenteAction,
} from "./actions";
import { Loader2, Edit, FileText } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import type { Database } from "@/types/database";

type PeriodoFiltro = Pick<Database["public"]["Tables"]["periodos"]["Row"], "id" | "nombre" | "activo">;
type GrupoFiltro = Pick<Database["public"]["Tables"]["grupos"]["Row"], "id" | "nombre" | "semestre">;
type DocenteFiltro = { id: string; nombre: string };
type SesionesConsulta = ComponentProps<typeof HorarioReadOnly>["sesiones"];
type HorarioConsulta = { id: string; estado: string } | null;

interface HorarioConsultasClientProps {
  periodos: PeriodoFiltro[];
  grupos: GrupoFiltro[];
  docentes?: DocenteFiltro[];
}

export default function HorarioConsultasClient({
  periodos,
  grupos,
  docentes = [],
}: HorarioConsultasClientProps) {
  const [modo, setModo] = useState<HorarioFiltroModo>("curso");
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>("");
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");
  const [sesiones, setSesiones] = useState<SesionesConsulta>([]);
  const [horario, setHorario] = useState<HorarioConsulta>(null);
  const [isPending, startTransition] = useTransition();

  const modoCurso = modo === "curso" && Boolean(selectedPeriodoId && selectedGrupoId);
  const modoDocente = modo === "docente" && Boolean(selectedPeriodoId && selectedDocenteId);
  const puedeConsultar = modoCurso || modoDocente;

  useEffect(() => {
    if (!puedeConsultar) {
      setSesiones([]);
      setHorario(null);
      return;
    }

    startTransition(() => {
      void (async () => {
        const res = modoCurso
          ? await getSesionesByPeriodoyGrupoAction(selectedPeriodoId, selectedGrupoId)
          : await getSesionesByPeriodoyDocenteAction(selectedPeriodoId, selectedDocenteId);
        setSesiones(res.sesiones);
        setHorario(res.horario);
      })();
    });
  }, [selectedPeriodoId, selectedGrupoId, selectedDocenteId, modoCurso, puedeConsultar]);

  const handleChangeModo = (siguiente: HorarioFiltroModo) => {
    setModo(siguiente);
    setSesiones([]);
    setHorario(null);
    if (siguiente === "curso") {
      setSelectedDocenteId("");
    } else {
      setSelectedGrupoId("");
    }
  };

  const pdfUrl = modoCurso
    ? `/api/pdf/mi-horario?grupoId=${selectedGrupoId}`
    : `/api/pdf/mi-horario?docenteId=${selectedDocenteId}`;

  const viewTitle = modoCurso
    ? `Curso: ${grupos.find((g) => g.id === selectedGrupoId)?.nombre}`
    : `Docente: ${docentes.find((d) => d.id === selectedDocenteId)?.nombre}`;

  const emptyMessage =
    !selectedPeriodoId
      ? "Seleccione un periodo académico para comenzar."
      : modo === "curso"
        ? "Seleccione un curso para ver su horario."
        : "Seleccione un docente para ver su horario.";

  return (
    <div className="space-y-6">
      <HorarioFilters
        periodos={periodos}
        grupos={grupos}
        docentes={docentes}
        modo={modo}
        selectedPeriodoId={selectedPeriodoId}
        selectedGrupoId={selectedGrupoId}
        selectedDocenteId={selectedDocenteId}
        onChangeModo={handleChangeModo}
        onChangePeriodo={setSelectedPeriodoId}
        onChangeGrupo={setSelectedGrupoId}
        onChangeDocente={setSelectedDocenteId}
      />

      {horario && puedeConsultar && (
        <div className="flex justify-end gap-3">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="s-btn s-btn-ghost flex items-center gap-2 border-[#C7BFA6] hover:bg-[#EFEAD9] py-2 px-4 rounded-lg text-xs"
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

      {isPending ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Cargando horario...</p>
        </div>
      ) : puedeConsultar ? (
        sesiones.length > 0 ? (
          <HorarioReadOnly
            sesiones={sesiones}
            title={viewTitle}
            subtitle={`Periodo Académico: ${periodos.find((p) => p.id === selectedPeriodoId)?.nombre} | Estado: ${horario?.estado.toUpperCase()}`}
            filtrarPorCurso={false}
          />
        ) : (
          <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
            No se encontraron clases programadas para esta selección en el periodo seleccionado.
          </div>
        )
      ) : (
        <div className="bg-white border border-[#D8D1BD] rounded-xl p-12 text-center text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
