"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarHorario, verificarHorarioExistente } from "./actions";
import type { ResultadoGeneracion } from "@/lib/scheduler/types";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, AlertCircle } from "lucide-react";

interface Periodo {
  id: string;
  nombre: string;
}

const ESTADO_LABEL: Record<string, string> = {
  publicado: "publicado",
  aprobado:  "aprobado",
  borrador:  "en borrador",
};

export function GenerarForm({ periodos }: { periodos: Periodo[] }) {
  const router = useRouter();
  const [periodoId, setPeriodoId]     = useState(periodos.find((p) => p.nombre.includes("2026"))?.id ?? "");
  const [loading, setLoading]         = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado]     = useState<ResultadoGeneracion | null>(null);
  const [logs, setLogs]               = useState<string[]>([]);

  // Estado del modal de confirmación
  const [confirm, setConfirm] = useState<{
    visible: boolean;
    id: string | null;
    estado: string | null;
    generado_en: string | null;
  }>({ visible: false, id: null, estado: null, generado_en: null });

  // 1. Al hacer submit primero verificamos si ya hay horario
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodoId) return;

    setVerificando(true);
    try {
      const info = await verificarHorarioExistente(periodoId);
      if (info.existe && info.estado === "borrador") {
        // Solo un borrador se puede sustituir; uno publicado queda inmutable.
        setConfirm({ visible: true, id: info.id, estado: info.estado, generado_en: info.generado_en });
      } else {
        // Si solo hay borrador o no hay nada, generar directamente
        await ejecutarGeneracion();
      }
    } finally {
      setVerificando(false);
    }
  }

  // 2. Ejecución real de la generación
  async function ejecutarGeneracion(reemplazarBorradorId?: string | null) {
    setConfirm({ visible: false, id: null, estado: null, generado_en: null });
    setLoading(true);
    setResultado(null);
    setLogs([]);

    try {
      const res = await generarHorario(periodoId, reemplazarBorradorId);
      setResultado(res);
      setLogs(res.log);
    } catch (err) {
      setLogs((prev) => [...prev, `❌ Error: ${err instanceof Error ? err.message : "Error desconocido"}`]);
    } finally {
      setLoading(false);
    }
  }

  const fechaConfirm = confirm.generado_en
    ? new Date(confirm.generado_en).toLocaleString("es-EC", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <div className="space-y-4">
      {/* Modal de confirmación */}
      {confirm.visible && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, padding: "28px 32px",
            maxWidth: 440, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "#FEF3C7", display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <AlertCircle style={{ width: 20, height: 20, color: "#D97706" }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0, color: "#0E1116" }}>
                  ¿Reemplazar horario existente?
                </p>
                <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                  Ya existe un horario {ESTADO_LABEL[confirm.estado ?? ""] ?? confirm.estado}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 20 }}>
              El borrador actual fue generado el <strong>{fechaConfirm}</strong>.
              Si continúas, será reemplazado solo después de completar con éxito un nuevo horario.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirm({ visible: false, id: null, estado: null, generado_en: null })}
                style={{
                  padding: "8px 18px", borderRadius: 8, border: "1px solid #D1D5DB",
                  background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  color: "#374151",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => ejecutarGeneracion(confirm.id)}
                style={{
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: "#0E1116", color: "#F5F1E8",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                Sí, reemplazar
              </button>
            </div>
          </div>
        </div>
      )}

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
              disabled={loading || verificando}
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
            disabled={loading || verificando || !periodoId}
            className="h-10 px-6"
          >
            {loading || verificando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {verificando ? "Verificando..." : "Generando..."}
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
                    {resultado.sesiones_generadas}/{resultado.sesiones_esperadas} sesiones por grupo generadas
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
    </div>
  );
}
