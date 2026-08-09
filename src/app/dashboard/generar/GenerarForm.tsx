"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { crearHorarioManual } from "./actions";
import type { EventoGeneracion, PasoGeneracion, ProgresoGeneracion, ResultadoGeneracion } from "@/lib/scheduler/types";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Circle } from "lucide-react";

interface Periodo {
  id: string;
  nombre: string;
  activo?: boolean;
}
interface Grupo { id: string; nombre: string; sede_id: string }
interface Sede { id: string; nombre: string }

const PASOS_UI: { id: Exclude<PasoGeneracion, "completado" | "error">; titulo: string }[] = [
  { id: "verificando", titulo: "Comprobar si ya existe un horario" },
  { id: "cargando", titulo: "Cargar materias, cursos, docentes y espacios" },
  { id: "validando", titulo: "Validar reglas y asignaciones" },
  { id: "resolviendo", titulo: "Colocar sesiones" },
  { id: "guardando", titulo: "Guardar borrador" },
];

const ORDEN_PASOS = PASOS_UI.map((p) => p.id);

function esPasoLista(paso: PasoGeneracion): paso is (typeof PASOS_UI)[number]["id"] {
  return ORDEN_PASOS.includes(paso as (typeof PASOS_UI)[number]["id"]);
}

function esAbortError(err: unknown) {
  return err instanceof DOMException
    ? err.name === "AbortError"
    : err instanceof Error && err.name === "AbortError";
}

export function GenerarForm({ periodos, grupos, sedes }: { periodos: Periodo[]; grupos: Grupo[]; sedes: Sede[] }) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const [periodoId, setPeriodoId] = useState(periodos.find((p) => p.activo)?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [creandoManual, setCreandoManual] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [progreso, setProgreso] = useState<ProgresoGeneracion | null>(null);
  const [falloEnPaso, setFalloEnPaso] = useState<(typeof PASOS_UI)[number]["id"] | null>(null);
  const [cancelado, setCancelado] = useState(false);

  const ocupado = loading || creandoManual;

  function marcarCancelado(paso: (typeof PASOS_UI)[number]["id"]) {
    setCancelado(true);
    setFalloEnPaso(paso);
    setResultado(null);
    setLogs(["Generación cancelada. No se guardó ningún horario."]);
    setProgreso({
      paso: "error",
      titulo: "Generación cancelada",
      detalle: "Detuviste el proceso. No se guardó ningún cambio.",
    });
  }

  function cancelarGeneracion() {
    abortRef.current?.abort();
  }

  async function ejecutarGeneracion() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setResultado(null);
    setLogs([]);
    setFalloEnPaso(null);
    setCancelado(false);
    setProgreso({
      paso: "verificando",
      titulo: "Comprobar si ya existe un horario",
      detalle: "Iniciando generación…",
    });

    let ultimoPasoLista: (typeof PASOS_UI)[number]["id"] = "verificando";

    try {
      const response = await fetch("/api/generar-horario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId,
          grupoId: grupoId || undefined,
          sedeId: sedeId || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? `No se pudo iniciar la generación (${response.status}).`);
      }

      if (!response.body) {
        throw new Error("El servidor no envió progreso de generación.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lineas = buffer.split("\n");
        buffer = lineas.pop() ?? "";

        for (const linea of lineas) {
          const trimmed = linea.trim();
          if (!trimmed) continue;
          let evento: EventoGeneracion;
          try {
            evento = JSON.parse(trimmed) as EventoGeneracion;
          } catch {
            continue;
          }

          if (evento.tipo === "progreso") {
            setProgreso(evento.progreso);
            if (esPasoLista(evento.progreso.paso)) {
              ultimoPasoLista = evento.progreso.paso;
            }
          } else if (evento.tipo === "resultado") {
            setResultado(evento.resultado);
            setLogs(evento.resultado.log);
            if (evento.resultado.exito) {
              setFalloEnPaso(null);
              setCancelado(false);
              setProgreso({
                paso: "completado",
                titulo: "Horario generado",
                detalle: `${evento.resultado.sesiones_generadas}/${evento.resultado.sesiones_esperadas} sesiones por grupo`,
                actual: evento.resultado.sesiones_generadas,
                total: evento.resultado.sesiones_esperadas,
              });
            } else {
              setFalloEnPaso(ultimoPasoLista);
              setProgreso((prev) => ({
                paso: "error",
                titulo: prev?.titulo ?? PASOS_UI.find((p) => p.id === ultimoPasoLista)?.titulo ?? "No se pudo completar",
                detalle: evento.resultado.conflictos_no_resueltos[0]?.mensaje ?? "Revisa los conflictos indicados abajo.",
                actual: prev?.actual,
                total: prev?.total,
              }));
            }
          } else if (evento.tipo === "cancelado") {
            marcarCancelado(ultimoPasoLista);
          } else if (evento.tipo === "error") {
            setFalloEnPaso(ultimoPasoLista);
            setLogs((prev) => [...prev, `❌ Error: ${evento.mensaje}`]);
            setProgreso({
              paso: "error",
              titulo: "Error al generar",
              detalle: evento.mensaje,
            });
          }
        }
      }
    } catch (err) {
      if (esAbortError(err) || controller.signal.aborted) {
        marcarCancelado(ultimoPasoLista);
      } else {
        const mensaje = err instanceof Error ? err.message : "Error desconocido";
        setFalloEnPaso(ultimoPasoLista);
        setLogs((prev) => [...prev, `❌ Error: ${mensaje}`]);
        setProgreso({
          paso: "error",
          titulo: "Error al generar",
          detalle: mensaje,
        });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodoId) return;
    await ejecutarGeneracion();
  }

  async function iniciarManual() {
    if (!periodoId) return;
    setCreandoManual(true);
    try {
      const resultadoManual = await crearHorarioManual(periodoId);
      if (resultadoManual.exito && resultadoManual.horario_id) router.push(`/dashboard/editar/${resultadoManual.horario_id}`);
      else setLogs([resultadoManual.error ?? "No se pudo iniciar el horario manual."]);
    } catch (error) {
      setLogs([error instanceof Error ? error.message : "No se pudo iniciar el horario manual."]);
    } finally {
      setCreandoManual(false);
    }
  }

  const pasoActual = progreso && esPasoLista(progreso.paso) ? progreso.paso : null;
  const indiceActual = pasoActual ? ORDEN_PASOS.indexOf(pasoActual) : -1;
  const indiceFallo = falloEnPaso ? ORDEN_PASOS.indexOf(falloEnPaso) : -1;
  const completado = progreso?.paso === "completado";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {["1. Prepara materias, cursos y docentes", "2. Elige generación automática o manual", "3. Revisa, ajusta y publica"].map((paso) => (
          <div key={paso} className="rounded-xl border border-[#D8D1BD] bg-[#EFEAD9] p-4 text-sm font-medium text-[#1F242D]">{paso}</div>
        ))}
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
              disabled={ocupado}
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
            <label htmlFor="sede" className="block text-base font-medium text-gray-800 mb-1.5">
              Sede <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <select
              id="sede"
              value={sedeId}
              onChange={(e) => { setSedeId(e.target.value); setGrupoId(""); }}
              className="w-full h-11 px-3 rounded-lg border border-[#C7BFA6] bg-white"
              disabled={ocupado}
            >
              <option value="">Todas las sedes</option>
              {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="curso" className="block text-base font-medium text-gray-800 mb-1.5">
              Curso <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <select
              id="curso"
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-[#C7BFA6] bg-white"
              disabled={ocupado}
            >
              <option value="">Todos los cursos</option>
              {grupos.filter((g) => !sedeId || g.sede_id === sedeId).map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              disabled={ocupado || !periodoId}
              className="h-11 bg-[#1D3FD9] px-6 text-white hover:bg-[#1733B5]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando…
                </>
              ) : (
                "Generar automáticamente"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={ocupado || !periodoId}
              onClick={iniciarManual}
              className="h-11 border-[#0E1116] px-6"
            >
              {creandoManual ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Creando…
                </>
              ) : (
                "Crear manualmente"
              )}
            </Button>
            {loading && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelarGeneracion}
                className="h-11 border-[#C8523B] px-6 text-[#7F2E20] hover:bg-[#FFF1ED]"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {progreso && (
          <div
            className="rounded-xl border border-[#D8D1BD] bg-white p-5 space-y-4"
            aria-live="polite"
            aria-busy={loading}
          >
            <div>
              <p className="font-semibold text-[#1F242D]">
                {completado
                  ? "Generación completada"
                  : cancelado
                    ? "Generación cancelada"
                    : progreso.paso === "error"
                      ? "Generación detenida"
                      : "Generando horario…"}
              </p>
              {progreso.detalle && (
                <p className="mt-1 text-sm text-gray-600">{progreso.detalle}</p>
              )}
              {pasoActual === "resolviendo" && progreso.total != null && progreso.total > 0 && (
                <p className="mt-2 text-sm font-medium text-[#1D3FD9]">
                  Sesión {progreso.actual ?? 0} / {progreso.total}
                </p>
              )}
            </div>

            <ol className="space-y-3">
              {PASOS_UI.map((paso, index) => {
                let estado: "pending" | "active" | "done" | "error" = "pending";
                if (completado || (indiceFallo < 0 && indiceActual > index) || (indiceFallo >= 0 && index < indiceFallo)) {
                  estado = "done";
                } else if (indiceFallo === index) {
                  estado = "error";
                } else if (loading && indiceActual === index) {
                  estado = "active";
                }

                return (
                  <li key={paso.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0">
                      {estado === "done" && <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />}
                      {estado === "active" && <Loader2 className="size-4 animate-spin text-[#1D3FD9]" aria-hidden />}
                      {estado === "error" && <XCircle className="size-4 text-red-600" aria-hidden />}
                      {estado === "pending" && <Circle className="size-4 text-gray-300" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={
                          estado === "active" ? "font-medium text-[#1F242D]"
                            : estado === "done" ? "text-gray-700"
                              : estado === "error" ? "font-medium text-red-800"
                                : "text-gray-400"
                        }
                      >
                        {paso.titulo}
                        {paso.id === "resolviendo" && estado === "active" && progreso.total != null && progreso.total > 0
                          ? ` · ${progreso.actual ?? 0}/${progreso.total}`
                          : ""}
                      </p>
                      {estado === "active" && progreso.detalle && pasoActual === paso.id && (
                        <p className="mt-0.5 text-xs text-gray-500">{progreso.detalle}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

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
