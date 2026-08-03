"use client";

import React from "react";
import type { Database } from "@/types/database";

type PeriodoFiltro = Pick<Database["public"]["Tables"]["periodos"]["Row"], "id" | "nombre" | "activo">;
type GrupoFiltro = Pick<Database["public"]["Tables"]["grupos"]["Row"], "id" | "nombre" | "semestre">;
type DocenteFiltro = { id: string; nombre: string };

interface HorarioFiltersProps {
  periodos: PeriodoFiltro[];
  grupos: GrupoFiltro[];
  docentes?: DocenteFiltro[];
  selectedPeriodoId: string;
  selectedGrupoId: string;
  selectedDocenteId?: string;
  onChangePeriodo: (id: string) => void;
  onChangeGrupo: (id: string) => void;
  onChangeDocente?: (id: string) => void;
}

export function HorarioFilters({
  periodos,
  grupos,
  docentes = [],
  selectedPeriodoId,
  selectedGrupoId,
  selectedDocenteId = "",
  onChangePeriodo,
  onChangeGrupo,
  onChangeDocente,
}: HorarioFiltersProps) {
  return (
    <div className="bg-[#F9F7F2] border border-[#D8D1BD] rounded-xl p-5 flex flex-col xl:flex-row gap-4 items-center justify-between shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
        {/* Selector de Periodo */}
        <div className="flex flex-col gap-1 w-full md:w-56">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
            Periodo Académico
          </label>
          <select
            value={selectedPeriodoId}
            onChange={(e) => onChangePeriodo(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D3FD9]/20 focus:border-[#1D3FD9]"
          >
            <option value="">Seleccione un Periodo</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.activo ? "(Activo)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Curso */}
        <div className="flex flex-col gap-1 w-full md:w-56">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
            Curso
          </label>
          <select
            value={selectedGrupoId}
            onChange={(e) => {
              onChangeGrupo(e.target.value);
              if (onChangeDocente) onChangeDocente("");
            }}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D3FD9]/20 focus:border-[#1D3FD9]"
            disabled={!selectedPeriodoId}
          >
            <option value="">Seleccione un Curso</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre} (Nivel {g.semestre})
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Docente (Opcional) */}
        {onChangeDocente && docentes.length > 0 && (
          <div className="flex flex-col gap-1 w-full md:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
              Docente
            </label>
            <select
              value={selectedDocenteId}
              onChange={(e) => {
                if (onChangeDocente) onChangeDocente(e.target.value);
                onChangeGrupo("");
              }}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D3FD9]/20 focus:border-[#1D3FD9]"
              disabled={!selectedPeriodoId}
            >
              <option value="">Seleccione un Docente</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 font-mono text-right w-full xl:w-auto">
        * Filtra por curso o por docente para ver su horario.
      </div>
    </div>
  );
}
