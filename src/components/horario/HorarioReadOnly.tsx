/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

interface HorarioReadOnlyProps {
  sesiones: any[];
  title?: string;
  subtitle?: string;
}

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

const HORAS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function horasEntre(inicio: string, fin: string): number {
  return (parseTime(fin) - parseTime(inicio)) / 60;
}

const COLORS = ["blue", "amber", "ink", "rose", "green"];
const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-900",
  amber: "bg-amber-50 border-amber-200 text-amber-900",
  ink: "bg-gray-50 border-gray-200 text-gray-900",
  rose: "bg-red-50 border-red-200 text-red-900",
  green: "bg-emerald-50 border-emerald-200 text-emerald-900",
};

export function HorarioReadOnly({ sesiones, title, subtitle }: HorarioReadOnlyProps) {
  const dias = sesiones.some((sesion) => sesion.dia_semana === 6) ? DIAS : DIAS.slice(0, 5);
  const gridStyle = { gridTemplateColumns: `80px repeat(${dias.length}, minmax(140px, 1fr))` };
  const materiaColorMap: Record<string, string> = {};
  let colorIdx = 0;

  sesiones.forEach((s) => {
    if (!materiaColorMap[s.materia_id]) {
      materiaColorMap[s.materia_id] = COLORS[colorIdx % COLORS.length];
      colorIdx++;
    }
  });

  return (
    <div className="bg-white border border-[#D8D1BD] rounded-xl shadow-md p-6 overflow-hidden">
      {(title || subtitle) && (
        <div className="border-b border-[#D8D1BD] pb-4 mb-6">
          {title && <h2 className="text-xl font-bold text-[#0E1116]">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header de Días */}
          <div className="grid border-b border-[#D8D1BD] pb-3 text-center" style={gridStyle}>
            <div className="font-semibold text-gray-400 text-xs flex items-center justify-center">Hora</div>
            {dias.map((d) => (
              <div key={d.id} className="font-semibold text-[#1F242D] text-sm py-1.5 border-l border-[#E5DFCC]/40">
                {d.label}
              </div>
            ))}
          </div>

          {/* Grilla Horaria */}
          <div>
            {HORAS.map((hora) => (
              <div
                key={hora}
                className="grid min-h-[43px] border-b border-[#E5DFCC]/60 last:border-b-0"
                style={gridStyle}
              >
                {/* Hora label */}
                <div className="flex items-start justify-center pt-2.5 text-[#4A515E] font-mono text-xs font-medium">
                  {hora}
                </div>

                {/* Celdas */}
                {dias.map((dia) => {
                  const sesionesEnCelda = sesiones.filter((s) => {
                    const sInicio = s.hora_inicio.slice(0, 5);
                    return s.dia_semana === dia.id && sInicio === hora;
                  });

                  return (
                    <div
                      key={`${dia.id}-${hora}`}
                      className="border-l border-[#E5DFCC]/40 p-1 min-h-[85px] relative hover:bg-gray-50/20 transition-colors"
                    >
                      {sesionesEnCelda.map((s) => {
                        const duracion = horasEntre(s.hora_inicio, s.hora_fin);
                        const color = materiaColorMap[s.materia_id] || "blue";
                        const styleClass = colorClasses[color] || colorClasses.blue;

                        return (
                          <div
                            key={s.id}
                            style={{
                              height: `${duracion * 86 - 4}px`,
                              minHeight: "39px",
                            }}
                            className={`absolute left-1 right-1 top-1 rounded-lg border p-2 text-[10px] leading-tight flex flex-col justify-between shadow-sm ${styleClass}`}
                          >
                            <div>
                              <div className="font-bold truncate" title={s.materias?.nombre}>
                                {s.materias?.codigo} - {s.materias?.nombre}
                              </div>
                              <div className="mt-1 opacity-80 truncate">
                                Docente: {s.docentes?.perfiles?.nombre}
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
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
