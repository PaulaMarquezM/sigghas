"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Conflicto } from "@/lib/scheduler/types";

interface ConflictPanelProps {
  conflictos: Conflicto[];
}

export function ConflictPanel({ conflictos }: ConflictPanelProps) {
  const errores = conflictos.filter((c) => c.tipo === "error");
  const advertencias = conflictos.filter((c) => c.tipo === "advertencia");

  return (
    <div className="border border-[#D8D1BD] bg-[#F9F7F2] rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="border-b border-[#D8D1BD] pb-4 mb-4">
        <h3 className="text-base font-semibold text-[#0E1116] flex items-center gap-2">
          <span>Panel de Validación</span>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-mono font-normal">
            RN01-RN43
          </span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Validación automática en tiempo real de reglas de negocio institucionales.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-2">
        {conflictos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[#2E7D5B] bg-emerald-50/50 border border-emerald-200/50 rounded-lg p-4">
            <CheckCircle2 className="w-8 h-8 mb-2 stroke-[1.5]" />
            <h4 className="text-sm font-semibold">¡Sin Conflictos!</h4>
            <p className="text-xs text-emerald-700 mt-1 max-w-[200px]">
              El horario cumple con el 100% de las reglas de negocio configuradas.
            </p>
          </div>
        ) : (
          <>
            {/* Errores */}
            {errores.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-red-700 uppercase tracking-wider pl-1">
                  Errores Críticos ({errores.length})
                </div>
                {errores.map((c, idx) => (
                  <div
                    key={`err-${idx}`}
                    className="flex gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50/40 text-red-950 text-xs shadow-sm hover:bg-red-50/60 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-bold text-red-800 bg-red-100 px-1 py-0.5 rounded mr-1">
                        {c.regla}
                      </span>
                      {c.mensaje}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Advertencias */}
            {advertencias.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider pl-1">
                  Advertencias ({advertencias.length})
                </div>
                {advertencias.map((c, idx) => (
                  <div
                    key={`warn-${idx}`}
                    className="flex gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-50/40 text-amber-950 text-xs shadow-sm hover:bg-amber-50/60 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded mr-1">
                        {c.regla}
                      </span>
                      {c.mensaje}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-[#D8D1BD] pt-4 mt-4 text-[10px] text-gray-400 font-mono flex items-center justify-between">
        <span>Estado del Horario</span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${conflictos.length > 0 ? "bg-red-500" : "bg-emerald-500"}`} />
          {conflictos.length > 0 ? "No Válido" : "Válido"}
        </span>
      </div>
    </div>
  );
}
