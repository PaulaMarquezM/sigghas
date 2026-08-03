/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Pencil } from "lucide-react";
import { HorarioCell } from "./HorarioCell";
import { BloqueDraggable } from "./BloqueDraggable";
import { generarSlots30, indiceColorEstable } from "@/lib/horario";

interface HorarioGridProps {
  sesiones: any[];
  editable?: boolean;
  onEspacioChange?: (sesionId: string, nuevoEspacioId: string | null) => void;
  onEditSession?: (sesion: any) => void;
  espaciosDisponibles?: any[];
}

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

const SLOT_HEIGHT_PX = 42;

// Helper to convert time "HH:MM" to minutes
function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Helper to calculate hours between two times
function horasEntre(inicio: string, fin: string): number {
  return (parseTime(fin) - parseTime(inicio)) / 60;
}

// Cada docente mantiene el mismo color en todas sus clases.
const COLORS = ["blue", "amber", "ink", "rose", "green"];
export function HorarioGrid({
  sesiones,
  editable = false,
  onEspacioChange,
  onEditSession,
  espaciosDisponibles = [],
}: HorarioGridProps) {
  const dias = sesiones.some((sesion) => sesion.dia_semana === 6) ? DIAS : DIAS.slice(0, 5);
  const horas = generarSlots30(sesiones);
  const gridStyle = { gridTemplateColumns: `80px repeat(${dias.length}, minmax(140px, 1fr))` };
  const docenteColorMap: Record<string, string> = {};
  sesiones.forEach((s) => {
    if (!docenteColorMap[s.docente_id]) {
      docenteColorMap[s.docente_id] = COLORS[indiceColorEstable(s.docente_id, COLORS.length)];
    }
  });

  return (
    <div className="sc-card w-full overflow-x-auto border-[#D8D1BD] bg-white rounded-xl shadow-lg p-6">
      <div className="min-w-[800px]">
        {/* Header de días */}
        <div className="grid border-b border-[#D8D1BD] pb-3 text-center" style={gridStyle}>
          <div className="font-semibold text-gray-500 text-xs flex align-center justify-center pt-2">Hora</div>
          {dias.map((dia) => (
            <div key={dia.id} className="font-semibold text-[#1F242D] text-sm py-1.5 border-l border-[#E5DFCC]/40">
              {dia.label}
            </div>
          ))}
        </div>

        {/* Grilla principal */}
        <div className="relative">
          {horas.map((hora) => (
            <div key={hora} className="grid min-h-[42px] border-b border-[#E5DFCC]/60 last:border-b-0" style={gridStyle}>
              {/* Hora row label */}
              <div className="flex items-start justify-center pt-2 text-[#4A515E] font-mono text-xs font-medium pr-3">
                {hora}
              </div>

              {/* Celdas por día */}
              {dias.map((dia) => {
                // Find sessions starting at this hour and day
                const sesionesEnCelda = sesiones.filter((s) => {
                  const sInicio = s.hora_inicio.slice(0, 5);
                  return s.dia_semana === dia.id && sInicio === hora;
                });

                return (
                  <HorarioCell key={`${dia.id}-${hora}`} dia={dia.id} hora={hora}>
                    {sesionesEnCelda.map((s) => {
                      const duracion = horasEntre(s.hora_inicio, s.hora_fin);
                      const colorClass = docenteColorMap[s.docente_id] || "blue";

                      return (
                        <div
                          key={s.id}
                          className="relative w-full group"
                          style={{
                            height: `${duracion * SLOT_HEIGHT_PX - 4}px`,
                            minHeight: "38px",
                            zIndex: 10,
                          }}
                        >
                          <BloqueDraggable
                            sesionId={s.id}
                            materiaCodigo={s.materias?.codigo || "MAT"}
                            materiaNombre={s.materias?.nombre || "Materia"}
                            docenteNombre={s.docentes?.perfiles?.nombre || "Docente"}
                            aulaNombre={s.espacios?.nombre || null}
                            grupoNombre={s.grupos?.nombre || "Grupo"}
                            modalidad={s.modalidad}
                            colorClass={colorClass}
                            disabled={!editable}
                          />

                          {editable && onEditSession && (
                            <button
                              type="button"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(event) => { event.stopPropagation(); onEditSession(s); }}
                              className="absolute right-2 top-2 z-30 grid size-7 place-items-center rounded-md bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100 focus:opacity-100"
                              aria-label={`Editar ${s.materias?.nombre ?? "sesión"}`}
                              title="Editar o eliminar sesión"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          )}

                          {/* Selector de Aula cuando es presencial y es editable */}
                          {editable && s.modalidad === "presencial" && onEspacioChange && (
                            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded p-1 z-20 flex gap-1 items-center">
                              <span className="text-[8px] text-white font-medium uppercase truncate flex-shrink-0">Aula:</span>
                              <select
                                data-cy={`select-espacio-${s.id}`}
                                value={s.espacio_id || ""}
                                onChange={(e) =>
                                  onEspacioChange(s.id, e.target.value === "" ? null : e.target.value)
                                }
                                className="w-full text-[9px] bg-white border border-gray-300 rounded px-1 py-0.5 text-gray-800 focus:outline-none"
                              >
                                <option value="">Sin Asignar</option>
                                {espaciosDisponibles.map((esp) => (
                                  <option key={esp.id} value={esp.id}>
                                    {esp.nombre} ({esp.capacidad}p)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </HorarioCell>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="sc-foot mt-6 space-y-3 border-t border-[#E5DFCC] pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs font-semibold text-[#1F242D]">Color: docente</span>
          {Object.entries(docenteColorMap).map(([docenteId, color]) => {
            const sesion = sesiones.find((s) => s.docente_id === docenteId);
            if (!sesion) return null;
            const bgClass =
              color === "blue"
                ? "bg-[#1D3FD9]"
                : color === "amber"
                ? "bg-[#E0A93B]"
                : color === "ink"
                ? "bg-[#0E1116]"
                : color === "rose"
                ? "bg-[#C8523B]"
                : "bg-[#2E7D5B]";
            return (
              <span key={docenteId} className="flex items-center gap-1.5 text-xs text-[#4A515E]">
                <i className={`w-3 h-3 rounded ${bgClass}`} />
                {sesion.docentes?.perfiles?.nombre || "Docente"}
              </span>
            );
          })}
        </div>
        <div className="text-xs text-[#4A515E] font-mono">
          * Todas las clases de un mismo docente usan el mismo color.
        </div>
      </div>
    </div>
  );
}
