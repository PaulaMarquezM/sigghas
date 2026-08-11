"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, X } from "lucide-react";
import { generarSlots30 } from "@/lib/horario";

export type EspacioDisponible = {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  accesible: boolean;
  sedes?: { nombre?: string | null } | null;
};

export type SesionOcupante = {
  espacio_id: string | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  materias?: { nombre?: string | null } | null;
  docentes?: { perfiles?: { nombre?: string | null } | null } | null;
  grupos?: { nombre?: string | null } | null;
};

export type BloqueDisponibilidadEspacio = {
  espacio_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
};

interface DisponibilidadAulasProps {
  espacios: EspacioDisponible[];
  sesiones: SesionOcupante[];
  disponibilidad?: BloqueDisponibilidadEspacio[];
  periodoNombre?: string | null;
}

const DIAS = [
  { id: 1, corto: "Lun", label: "Lunes" },
  { id: 2, corto: "Mar", label: "Martes" },
  { id: 3, corto: "Mié", label: "Miércoles" },
  { id: 4, corto: "Jue", label: "Jueves" },
  { id: 5, corto: "Vie", label: "Viernes" },
  { id: 6, corto: "Sáb", label: "Sábado" },
];

function minutos(hora: string) {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function sumar30Minutos(hora: string) {
  const total = minutos(hora) + 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function seSolapan(inicioA: string, finA: string, inicioB: string, finB: string) {
  return minutos(inicioA) < minutos(finB) && minutos(inicioB) < minutos(finA);
}

export function DisponibilidadAulas({
  espacios,
  sesiones,
  disponibilidad = [],
}: DisponibilidadAulasProps) {
  const router = useRouter();
  const [espacioSeleccionadoId, setEspacioSeleccionadoId] = useState(espacios[0]?.id ?? "");

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [router]);

  const horas = useMemo(
    () => generarSlots30([...sesiones, ...disponibilidad]).slice(0, -1),
    [disponibilidad, sesiones],
  );

  const espacioSeleccionado =
    espacios.find((espacio) => espacio.id === espacioSeleccionadoId) ??
    espacios[0] ??
    null;

  const obtenerEstado = (dia: number, hora: string) => {
    if (!espacioSeleccionado) return { estado: "libre" as const };
    const fin = sumar30Minutos(hora);
    const sesion = sesiones.find(
      (item) =>
        item.espacio_id === espacioSeleccionado.id &&
        item.dia_semana === dia &&
        seSolapan(hora, fin, item.hora_inicio, item.hora_fin),
    );
    if (sesion) return { estado: "ocupado" as const, sesion };

    const bloqueo = disponibilidad.find(
      (item) =>
        item.espacio_id === espacioSeleccionado.id &&
        item.dia_semana === dia &&
        !item.disponible &&
        seSolapan(hora, fin, item.hora_inicio, item.hora_fin),
    );
    if (bloqueo) return { estado: "bloqueado" as const };
    return { estado: "libre" as const };
  };

  return (
    <div className="space-y-4">
      <label className="block max-w-sm" htmlFor="seleccionar-espacio">
        <span className="sr-only">Buscar aula o laboratorio</span>
        <select
          id="seleccionar-espacio"
          value={espacioSeleccionado?.id ?? ""}
          onChange={(event) => setEspacioSeleccionadoId(event.target.value)}
          className="h-10 w-full rounded-lg border border-[#C7BFA6] bg-white px-3 text-sm font-medium text-[#1F242D] outline-none transition focus:border-[#1D3FD9] focus:ring-4 focus:ring-[#1D3FD9]/10"
        >
          {espacios.map((espacio) => (
            <option key={espacio.id} value={espacio.id}>
              {espacio.nombre} · {espacio.tipo === "laboratorio" ? "Laboratorio" : "Aula"}
            </option>
          ))}
        </select>
      </label>

      {espacioSeleccionado ? (
        <section className="overflow-x-auto rounded-xl border border-[#D8D1BD] bg-white">
          <div className="min-w-[860px] overflow-hidden rounded-xl bg-[#D8D1BD]">
            <div className="grid grid-cols-[74px_repeat(6,minmax(118px,1fr))] gap-px bg-[#D8D1BD]">
                      <div className="flex items-center justify-center bg-[#0E1116] px-2 py-3 text-white">
                        <Clock3 aria-hidden="true" className="h-4 w-4" />
                        <span className="sr-only">Hora</span>
                      </div>
                      {DIAS.map((dia) => (
                        <div key={dia.id} className="bg-[#0E1116] px-2 py-3 text-center text-xs font-semibold text-white">
                          <span className="sm:hidden">{dia.corto}</span>
                          <span className="hidden sm:inline">{dia.label}</span>
                        </div>
                      ))}

                      {horas.map((hora) => (
                        <React.Fragment key={hora}>
                          <div className="flex items-center justify-center bg-[#F5F1E8] px-2 py-2 font-mono text-[11px] font-semibold text-[#4A515E]">
                            {hora}
                          </div>
                          {DIAS.map((dia) => {
                            const resultado = obtenerEstado(dia.id, hora);
                            const libre = resultado.estado === "libre";
                            const titulo =
                              resultado.estado === "ocupado"
                                ? `${resultado.sesion.materias?.nombre ?? "Clase"} · ${resultado.sesion.grupos?.nombre ?? "Grupo"} · ${resultado.sesion.hora_inicio.slice(0, 5)}–${resultado.sesion.hora_fin.slice(0, 5)}`
                                : resultado.estado === "bloqueado"
                                  ? "Bloque configurado como no disponible"
                                  : `${espacioSeleccionado.nombre} disponible`;
                            return (
                              <div
                                key={`${dia.id}-${hora}`}
                                title={titulo}
                                className={`group relative flex min-h-10 items-center justify-center gap-1.5 px-2 py-2 text-center text-[10px] font-semibold transition ${
                                  libre
                                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                    : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                                }`}
                              >
                                {libre ? <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : <X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                                <span>{libre ? "Disponible" : resultado.estado === "bloqueado" ? "Bloqueado" : "Ocupado"}</span>
                                <span className="sr-only">, {titulo}</span>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
            </div>
          </div>
        </section>
      ) : (
        <p className="py-10 text-center text-sm text-[#697180]">No hay aulas o laboratorios disponibles.</p>
      )}
    </div>
  );
}
