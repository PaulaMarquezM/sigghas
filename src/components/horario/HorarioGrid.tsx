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
const TIME_COL_PX = 80;

const COLORS = ["blue", "amber", "ink", "rose", "green", "teal", "coral", "slate", "lime", "plum"];

const LEGEND_BG: Record<string, string> = {
  blue: "bg-[#1D3FD9]",
  amber: "bg-[#E0A93B]",
  ink: "bg-[#0E1116]",
  rose: "bg-[#C8523B]",
  green: "bg-[#2E7D5B]",
  teal: "bg-[#0F766E]",
  coral: "bg-[#B45309]",
  slate: "bg-[#475569]",
  lime: "bg-[#4D7C0F]",
  plum: "bg-[#9F1239]",
};

function minutoDe(hora: string): number {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

/** Índice de fila (0-based) donde empieza la sesión y línea de fin exclusiva en la grilla CSS. */
function rangoFilas(horas: string[], horaInicio: string, horaFin: string): { start: number; end: number } {
  const inicio = horaInicio.slice(0, 5);
  const finMin = minutoDe(horaFin);
  const start = horas.findIndex((h) => h === inicio);
  let end = horas.findIndex((h) => minutoDe(h) >= finMin);
  if (start < 0) return { start: 0, end: 1 };
  if (end <= start) end = start + 1;
  return { start, end };
}

export function HorarioGrid({
  sesiones,
  editable = false,
  onEspacioChange,
  onEditSession,
  espaciosDisponibles = [],
}: HorarioGridProps) {
  const dias = DIAS;
  const horas = generarSlots30(sesiones);
  const docenteColorMap: Record<string, string> = {};
  sesiones.forEach((s) => {
    if (!docenteColorMap[s.docente_id]) {
      docenteColorMap[s.docente_id] = COLORS[indiceColorEstable(s.docente_id, COLORS.length)];
    }
  });

  const gridTemplate = {
    display: "grid" as const,
    gridTemplateColumns: `${TIME_COL_PX}px repeat(${dias.length}, minmax(140px, 1fr))`,
    gridTemplateRows: `repeat(${horas.length}, ${SLOT_HEIGHT_PX}px)`,
  };

  return (
    <div className="sc-card w-full border-[#D8D1BD] bg-white rounded-xl shadow-lg p-6 overflow-visible">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header de días */}
          <div
            className="grid border-b border-[#D8D1BD] pb-3 text-center"
            style={{ gridTemplateColumns: `${TIME_COL_PX}px repeat(${dias.length}, minmax(140px, 1fr))` }}
          >
            <div className="font-semibold text-gray-500 text-xs flex align-center justify-center pt-2">Hora</div>
            {dias.map((dia) => (
              <div key={dia.id} className="font-semibold text-[#1F242D] text-sm py-1.5 border-l border-[#E5DFCC]/40">
                {dia.label}
              </div>
            ))}
          </div>

          {/* Una sola CSS Grid: las clases ocupan grid-row span hasta hora_fin */}
          <div className="relative" style={gridTemplate}>
            {horas.map((hora, rowIdx) => (
              <React.Fragment key={hora}>
                <div
                  className="flex items-start justify-center pt-2 text-[#4A515E] font-mono text-xs font-medium pr-3 border-b border-[#E5DFCC]/60"
                  style={{ gridColumn: 1, gridRow: rowIdx + 1 }}
                >
                  {hora}
                </div>
                {dias.map((dia, diaIdx) => (
                  <div
                    key={`${dia.id}-${hora}`}
                    className="border-b border-[#E5DFCC]/60 border-l border-[#E5DFCC]/40"
                    style={{ gridColumn: diaIdx + 2, gridRow: rowIdx + 1 }}
                  >
                    <HorarioCell dia={dia.id} hora={hora} />
                  </div>
                ))}
              </React.Fragment>
            ))}

            {sesiones.map((s) => {
              const diaIdx = dias.findIndex((d) => d.id === s.dia_semana);
              if (diaIdx < 0) return null;
              const { start, end } = rangoFilas(horas, s.hora_inicio, s.hora_fin);
              const colorClass = docenteColorMap[s.docente_id] || "blue";

              return (
                <div
                  key={s.id}
                  className="group relative z-20 m-0.5"
                  data-hora-inicio={s.hora_inicio}
                  data-hora-fin={s.hora_fin}
                  data-row-start={start}
                  data-row-end={end}
                  style={{
                    gridColumn: diaIdx + 2,
                    gridRow: `${start + 1} / ${end + 1}`,
                    minHeight: 0,
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
          </div>
        </div>
      </div>

      <div className="sc-foot mt-6 space-y-3 border-t border-[#E5DFCC] pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs font-semibold text-[#1F242D]">Color: docente</span>
          {Object.entries(docenteColorMap).map(([docenteId, color]) => {
            const sesion = sesiones.find((s) => s.docente_id === docenteId);
            if (!sesion) return null;
            return (
              <span key={docenteId} className="flex items-center gap-1.5 text-xs text-[#4A515E]">
                <i className={`w-3 h-3 rounded ${LEGEND_BG[color] ?? LEGEND_BG.blue}`} />
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
