"use client";

import React from "react";
import type { Database } from "@/types/database";

type PeriodoFiltro = Pick<Database["public"]["Tables"]["periodos"]["Row"], "id" | "nombre" | "activo">;
type GrupoFiltro = Pick<Database["public"]["Tables"]["grupos"]["Row"], "id" | "nombre" | "semestre">;
type DocenteFiltro = { id: string; nombre: string };
export type HorarioFiltroModo = "curso" | "docente";

interface HorarioFiltersProps {
  periodos: PeriodoFiltro[];
  grupos: GrupoFiltro[];
  docentes?: DocenteFiltro[];
  modo: HorarioFiltroModo;
  selectedPeriodoId: string;
  selectedGrupoId: string;
  selectedDocenteId?: string;
  onChangeModo: (modo: HorarioFiltroModo) => void;
  onChangePeriodo: (id: string) => void;
  onChangeGrupo: (id: string) => void;
  onChangeDocente?: (id: string) => void;
}

export function HorarioFilters({
  periodos,
  grupos,
  docentes = [],
  modo,
  selectedPeriodoId,
  selectedGrupoId,
  selectedDocenteId = "",
  onChangeModo,
  onChangePeriodo,
  onChangeGrupo,
  onChangeDocente,
}: HorarioFiltersProps) {
  const tieneDocentes = Boolean(onChangeDocente && docentes.length > 0);

  return (
    <div className="bg-[#F9F7F2] border border-[#D8D1BD] rounded-xl p-5 shadow-sm space-y-4">
      {tieneDocentes && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
            Consultar por
          </p>
          <div
            role="tablist"
            aria-label="Modo de consulta"
            className="inline-flex w-full sm:w-auto rounded-lg border border-[#C7BFA6] bg-white p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={modo === "curso"}
              onClick={() => onChangeModo("curso")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                modo === "curso"
                  ? "bg-[#0E1116] text-white"
                  : "text-gray-600 hover:bg-[#F3F0E7]"
              }`}
            >
              Por Curso
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === "docente"}
              onClick={() => onChangeModo("docente")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                modo === "docente"
                  ? "bg-[#0E1116] text-white"
                  : "text-gray-600 hover:bg-[#F3F0E7]"
              }`}
            >
              Por Docente
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
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

        {modo === "curso" ? (
          <div className="flex flex-col gap-1 w-full md:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
              Curso
            </label>
            <select
              value={selectedGrupoId}
              onChange={(e) => onChangeGrupo(e.target.value)}
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
        ) : (
          onChangeDocente && (
            <div className="flex flex-col gap-1 w-full md:w-56">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
                Docente
              </label>
              <select
                value={selectedDocenteId}
                onChange={(e) => onChangeDocente(e.target.value)}
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
          )
        )}
      </div>
    </div>
  );
}
