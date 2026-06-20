"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarHorario } from "./actions";
import type { ResultadoGeneracion } from "@/lib/scheduler/types";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Periodo {
  id: string;
  nombre: string;
}

export function GenerarForm({ periodos }: { periodos: Periodo[] }) {
  const router = useRouter();
  const [periodoId, setPeriodoId] = useState(periodos.find((p) => p.nombre.includes("2026"))?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodoId) return;

    setLoading(true);
    setResultado(null);
    setLogs([]);

    try {
      const res = await generarHorario(periodoId);
      setResultado(res);
      setLogs(res.log);
    } catch (err) {
      setLogs((prev) => [...prev, `❌ Error: ${err instanceof Error ? err.message : "Error desconocido"}`]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label htmlFor="periodo" className="block text-sm font-medium text-gray-700 mb-1">
            Periodo Académico
          </label>
          <select
            id="periodo"
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          >
            <option value="">Seleccionar periodo...</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading || !periodoId}
          className="h-10 px-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            "Generar Horario"
          )}
        </Button>
      </div>

      {logs.length > 0 && (
        <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-xs leading-relaxed max-h-80 overflow-y-auto">
          {logs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
        </div>
      )}

      {resultado && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-3">
              {resultado.exito ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {resultado.exito ? "Horario generado exitosamente" : "Horario generado con conflictos"}
                </p>
                <p className="text-sm text-gray-500">
                  {resultado.total_asignaciones} asignaciones creadas
                  {resultado.conflictos_no_resueltos.length > 0 &&
                    ` · ${resultado.conflictos_no_resueltos.length} conflicto(s) sin resolver`}
                </p>
              </div>
            </div>

            {resultado.conflictos_no_resueltos.length > 0 && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-red-800">Conflictos detectados:</p>
                {resultado.conflictos_no_resueltos.map((c, i) => (
                  <div key={i} className="text-xs text-red-700 flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>[{c.codigo}] {c.mensaje}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/editar/${resultado.horario_id}`)}
              >
                Editar Horario
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/dashboard")}
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
