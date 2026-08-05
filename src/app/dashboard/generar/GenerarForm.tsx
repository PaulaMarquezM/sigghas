"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearHorarioManual, generarHorario, verificarHorarioExistente } from "./actions";
import type { ResultadoGeneracion } from "@/lib/scheduler/types";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Periodo {
  id: string;
  nombre: string;
  activo?: boolean;
}
interface Grupo { id: string; nombre: string; sede_id: string }
interface Sede { id: string; nombre: string }

export function GenerarForm({ periodos, grupos, sedes }: { periodos: Periodo[]; grupos: Grupo[]; sedes: Sede[] }) {
  const router = useRouter();
  const [periodoId, setPeriodoId]     = useState(periodos.find((p) => p.activo)?.id ?? "");
  const [loading, setLoading]         = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [creandoManual, setCreandoManual] = useState(false);
  const [resultado, setResultado]     = useState<ResultadoGeneracion | null>(null);
  const [logs, setLogs]               = useState<string[]>([]);
  const [grupoId, setGrupoId]         = useState("");
  const [sedeId, setSedeId]           = useState("");

  // 1. Al hacer submit primero verificamos si ya hay horario
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodoId) return;

    setVerificando(true);
    try {
      const info = await verificarHorarioExistente(periodoId);
      if (info.existe) {
        setLogs(["Ya existe un horario para este período. Edítalo desde el editor manual."]);
        return;
      }
      await ejecutarGeneracion();
    } finally {
      setVerificando(false);
    }
  }

  // 2. Ejecución real de la generación
  async function ejecutarGeneracion() {
    setLoading(true);
    setResultado(null);
    setLogs([]);

    try {
      const res = await generarHorario(periodoId, null, { grupoId: grupoId || undefined, sedeId: sedeId || undefined });
      setResultado(res);
      setLogs(res.log);
    } catch (err) {
      setLogs((prev) => [...prev, `❌ Error: ${err instanceof Error ? err.message : "Error desconocido"}`]);
    } finally {
      setLoading(false);
    }
  }

  async function iniciarManual() {
    if (!periodoId) return;
    setCreandoManual(true);
    try {
      const resultado = await crearHorarioManual(periodoId);
      if (resultado.exito && resultado.horario_id) router.push(`/dashboard/editar/${resultado.horario_id}`);
      else setLogs([resultado.error ?? "No se pudo iniciar el horario manual."]);
    } catch (error) {
      setLogs([error instanceof Error ? error.message : "No se pudo iniciar el horario manual."]);
    } finally {
      setCreandoManual(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {["1. Prepara materias, cursos y docentes", "2. Elige generación automática o manual", "3. Revisa, ajusta y publica"].map((paso) => <div key={paso} className="rounded-xl border border-[#D8D1BD] bg-[#EFEAD9] p-4 text-sm font-medium text-[#1F242D]">{paso}</div>)}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-stretch gap-4 rounded-xl border border-[#D8D1BD] bg-white p-5 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="periodo" className="block text-base font-medium text-gray-800 mb-1.5">
              Período académico <span className="text-[#C8523B]">*</span>
            </label>
            <select
              id="periodo"
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-[#C7BFA6] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#1D3FD9]/20"
              disabled={loading || verificando || creandoManual}
            >
              <option value="">Seleccionar periodo...</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id} disabled={p.activo === false}>
                  {p.nombre}{p.activo === false ? " (inactivo)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="sede" className="block text-base font-medium text-gray-800 mb-1.5">Sede <span className="text-gray-400 text-xs">(opcional)</span></label>
            <select id="sede" value={sedeId} onChange={(e) => { setSedeId(e.target.value); setGrupoId(""); }} className="w-full h-11 px-3 rounded-lg border border-[#C7BFA6] bg-white" disabled={loading || verificando || creandoManual}>
              <option value="">Todas las sedes</option>{sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select>
          </div>
          <div className="flex-1">
            <label htmlFor="curso" className="block text-base font-medium text-gray-800 mb-1.5">Curso <span className="text-gray-400 text-xs">(opcional)</span></label>
            <select id="curso" value={grupoId} onChange={(e) => setGrupoId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-[#C7BFA6] bg-white" disabled={loading || verificando || creandoManual}>
              <option value="">Todos los cursos</option>{grupos.filter((g) => !sedeId || g.sede_id === sedeId).map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}</select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row"><Button
            type="submit"
            disabled={loading || verificando || creandoManual || !periodoId}
            className="h-11 bg-[#1D3FD9] px-6 text-white hover:bg-[#1733B5]"
          >
            {loading || verificando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {verificando ? "Verificando..." : "Generando..."}
              </>
            ) : (
              "Generar automáticamente"
            )}
          </Button><Button type="button" variant="outline" disabled={loading || verificando || creandoManual || !periodoId} onClick={iniciarManual} className="h-11 border-[#0E1116] px-6">{creandoManual ? <><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />Creando…</> : "Crear manualmente"}</Button></div>
        </div>

        {logs.length > 0 && (
          <div className="bg-[#FFF1ED] text-[#7F2E20] border border-[#E7A796] rounded-lg p-4 text-sm leading-relaxed max-h-80 overflow-y-auto">
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
                <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                  <p className="text-base font-semibold text-red-900">Corrige estos datos antes de volver a intentar:</p>
                  {resultado.conflictos_no_resueltos.map((c, i) => (
                    <div key={i} className="text-sm leading-relaxed text-red-800 flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{c.mensaje}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {resultado.exito && resultado.horario_id && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/editar/${resultado.horario_id}`)}
                  >
                    Editar Horario
                  </Button>
                )}
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
