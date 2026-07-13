"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, ShieldCheck, ShieldAlert, Clock, Calendar } from "lucide-react";

interface DisponibilidadAulasProps {
  espacios: any[];
  sesiones: any[];
}

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

const HORAS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export function DisponibilidadAulas({ espacios, sesiones }: DisponibilidadAulasProps) {
  const router = useRouter();

  // Auto-refresh the page content every 15 seconds to get real-time availability updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  const [selectedDia, setSelectedDia] = useState<number>(1); // Default determinista para SSR (Lunes)
  const [selectedHora, setSelectedHora] = useState<string>("07:00"); // Default determinista

  useEffect(() => {
    // Al cargar en el cliente, actualizamos con la hora real
    const now = new Date();
    const currentDay = Math.min(Math.max(now.getDay(), 1), 6);
    const currentHour = `${String(now.getHours()).padStart(2, "0")}:00`;
    
    setSelectedDia(currentDay);
    if (HORAS.includes(currentHour)) {
      setSelectedHora(currentHour);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Controles de Selección de Bloque Horario */}
      <div className="bg-[#F9F7F2] border border-[#D8D1BD] rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1 w-full md:w-48">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Día</span>
            </label>
            <select
              value={selectedDia}
              onChange={(e) => setSelectedDia(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D3FD9]/20"
            >
              {DIAS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full md:w-48">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Bloque de Inicio</span>
            </label>
            <select
              value={selectedHora}
              onChange={(e) => setSelectedHora(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D3FD9]/20"
            >
              {HORAS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-mono text-right w-full md:w-auto">
          Mostrando estado para el {DIAS.find((d) => d.id === selectedDia)?.label} a las {selectedHora}.
        </div>
      </div>

      {/* Grid de Aulas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {espacios.map((esp) => {
          // Check if space is occupied during selectedDia and selectedHora
          // An classroom is occupied if a session overlaps with selectedHora
          // Overlap: s.dia_semana === selectedDia && s.hora_inicio <= selectedHora && s.hora_fin > selectedHora
          const sesionOcupante = sesiones.find((s) => {
            const sInicio = s.hora_inicio.slice(0, 5);
            const sFin = s.hora_fin.slice(0, 5);
            return (
              s.espacio_id === esp.id &&
              s.dia_semana === selectedDia &&
              sInicio <= selectedHora &&
              sFin > selectedHora
            );
          });

          const estaOcupada = !!sesionOcupante;

          return (
            <div
              key={esp.id}
              className={`border rounded-xl p-5 flex flex-col justify-between h-44 shadow-sm transition-all duration-300 hover:shadow-md ${
                estaOcupada
                  ? "bg-red-50/30 border-red-200"
                  : "bg-emerald-50/20 border-emerald-200"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        estaOcupada
                          ? "bg-red-100/60 text-red-700"
                          : "bg-emerald-100/60 text-emerald-700"
                      }`}
                    >
                      <DoorOpen className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#0E1116]">{esp.nombre}</h3>
                      <span className="text-[10px] text-gray-500 capitalize bg-white/60 border border-gray-200 px-1.5 py-0.5 rounded">
                        {esp.tipo === "laboratorio" ? "Laboratorio" : "Aula Común"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      estaOcupada
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {estaOcupada ? (
                      <>
                        <ShieldAlert className="w-3 h-3" />
                        Ocupado
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        Libre
                      </>
                    )}
                  </span>
                </div>

                {estaOcupada ? (
                  <div className="text-xs space-y-1 pt-2">
                    <div className="font-semibold text-gray-700 truncate" title={sesionOcupante.materias?.nombre}>
                      {sesionOcupante.materias?.nombre}
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center justify-between">
                      <span className="truncate max-w-[110px]" title={sesionOcupante.docentes?.perfiles?.nombre}>
                        Doc: {sesionOcupante.docentes?.perfiles?.nombre}
                      </span>
                      <span className="font-semibold bg-gray-200/60 text-gray-700 px-1 rounded">
                        {sesionOcupante.grupos?.nombre}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 pt-2 flex flex-col justify-center h-12">
                    <p>Espacio libre para asignación o estudio libre.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 mt-1 text-[10px] text-gray-400 flex justify-between">
                <span>Capacidad: {esp.capacidad} estudiantes</span>
                <span>{esp.accesible ? "Accesible" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
