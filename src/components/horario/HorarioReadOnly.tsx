/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { generarSlots30, indiceColorEstable } from "@/lib/horario";

interface HorarioReadOnlyProps {
  sesiones: any[];
  title?: string;
  subtitle?: string;
  filtrarPorCurso?: boolean;
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
const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-900",
  amber: "bg-amber-50 border-amber-200 text-amber-900",
  ink: "bg-gray-50 border-gray-200 text-gray-900",
  rose: "bg-red-50 border-red-200 text-red-900",
  green: "bg-emerald-50 border-emerald-200 text-emerald-900",
  teal: "bg-teal-50 border-teal-200 text-teal-900",
  coral: "bg-orange-50 border-orange-200 text-orange-900",
  slate: "bg-slate-50 border-slate-200 text-slate-900",
  lime: "bg-lime-50 border-lime-200 text-lime-900",
  plum: "bg-rose-50 border-rose-200 text-rose-900",
};

function minutoDe(hora: string): number {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function rangoFilas(horas: string[], horaInicio: string, horaFin: string): { start: number; end: number } {
  const inicio = horaInicio.slice(0, 5);
  const finMin = minutoDe(horaFin);
  const start = horas.findIndex((h) => h === inicio);
  let end = horas.findIndex((h) => minutoDe(h) >= finMin);
  if (start < 0) return { start: 0, end: 1 };
  if (end <= start) end = start + 1;
  return { start, end };
}

export function HorarioReadOnly({ sesiones, title, subtitle, filtrarPorCurso = true }: HorarioReadOnlyProps) {
  const cursos = Array.from(new Map(sesiones.filter((sesion) => sesion.grupo_id).map((sesion) => [sesion.grupo_id, sesion.grupos?.nombre || "Curso"])).entries());
  const [cursoSeleccionado, setCursoSeleccionado] = useState(cursos[0]?.[0] ?? "");
  const cursoActivo = cursos.some(([id]) => id === cursoSeleccionado) ? cursoSeleccionado : cursos[0]?.[0] ?? "";
  const sesionesVisibles = filtrarPorCurso ? (cursoActivo ? sesiones.filter((sesion) => sesion.grupo_id === cursoActivo) : []) : sesiones;
  const dias = DIAS;
  const horas = generarSlots30(sesionesVisibles);
  const docenteColorMap: Record<string, string> = {};

  sesionesVisibles.forEach((s) => {
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
    <div className="bg-white border border-[#D8D1BD] rounded-xl shadow-md p-6 overflow-visible">
      {(title || subtitle) && (
        <div className="border-b border-[#D8D1BD] pb-4 mb-6">
          {title && <h2 className="text-xl font-bold text-[#0E1116]">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}

      {filtrarPorCurso && cursos.length > 0 && (
        <div className="mb-5 flex flex-col gap-1.5 rounded-lg border border-[#E5DFCC] bg-[#F9F7F2] p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#4A515E]" htmlFor="horario-curso">
            Curso
            <select id="horario-curso" value={cursoActivo} onChange={(event) => setCursoSeleccionado(event.target.value)} className="h-9 rounded-md border border-[#C7BFA6] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#1F242D] outline-none focus:border-[#1D3FD9]">
              {cursos.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
            </select>
          </label>
          <span className="text-xs text-[#697180]">{sesionesVisibles.length} clase{sesionesVisibles.length === 1 ? "" : "s"}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div
            className="grid border-b border-[#D8D1BD] pb-3 text-center"
            style={{ gridTemplateColumns: `${TIME_COL_PX}px repeat(${dias.length}, minmax(140px, 1fr))` }}
          >
            <div className="font-semibold text-gray-400 text-xs flex items-center justify-center">Hora</div>
            {dias.map((d) => (
              <div key={d.id} className="font-semibold text-[#1F242D] text-sm py-1.5 border-l border-[#E5DFCC]/40">
                {d.label}
              </div>
            ))}
          </div>

          <div className="relative" style={gridTemplate}>
            {horas.map((hora, rowIdx) => (
              <React.Fragment key={hora}>
                <div
                  className="flex items-start justify-center pt-2.5 text-[#4A515E] font-mono text-xs font-medium border-b border-[#E5DFCC]/60"
                  style={{ gridColumn: 1, gridRow: rowIdx + 1 }}
                >
                  {hora}
                </div>
                {dias.map((dia, diaIdx) => (
                  <div
                    key={`${dia.id}-${hora}`}
                    className="border-b border-[#E5DFCC]/60 border-l border-[#E5DFCC]/40"
                    style={{ gridColumn: diaIdx + 2, gridRow: rowIdx + 1 }}
                  />
                ))}
              </React.Fragment>
            ))}

            {sesionesVisibles.map((s) => {
              const diaIdx = dias.findIndex((d) => d.id === s.dia_semana);
              if (diaIdx < 0) return null;
              const { start, end } = rangoFilas(horas, s.hora_inicio, s.hora_fin);
              const color = docenteColorMap[s.docente_id] || "blue";
              const styleClass = colorClasses[color] || colorClasses.blue;

              return (
                <div
                  key={s.id}
                  style={{
                    gridColumn: diaIdx + 2,
                    gridRow: `${start + 1} / ${end + 1}`,
                    minHeight: 0,
                  }}
                  className={`relative z-20 m-0.5 rounded-lg border p-2 text-[10px] leading-tight flex flex-col justify-between shadow-sm ${styleClass}`}
                >
                  <div>
                    <div className="font-bold truncate" title={s.materias?.nombre}>
                      {s.materias?.nombre}
                    </div>
                    <div className="mt-1 opacity-80 truncate">
                      Docente: {s.docentes?.perfiles?.nombre}
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] opacity-70">
                      {s.hora_inicio.slice(0, 5)} – {s.hora_fin.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-current/10 pt-1 text-[9px] mt-1">
                    <span className="font-semibold">{s.grupos?.nombre}</span>
                    <span className="bg-current/10 px-1 py-0.5 rounded text-[8px]">
                      {s.modalidad === "presencial" ? s.espacios?.nombre || "S/A" : s.modalidad === "hibrida" ? "Híbrida" : "Virtual"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
