import { etiquetaMateria, generarSlots, ordenarMateriasPorPrioridad, validarCandidato } from "./greedy";
import { assertGeneracionNoCancelada, type Asignacion, type Conflicto, type ContextoProgramacion, type OnProgresoGeneracion } from "./types";

function etiquetaPendiente(pendiente: { materia_id: string; grupo_id: string; docente_id: string }, ctx: ContextoProgramacion) {
  const materia = ctx.materias.find((m) => m.id === pendiente.materia_id);
  const grupo = ctx.grupos.find((g) => g.id === pendiente.grupo_id);
  const docente = ctx.docentes.find((d) => d.id === pendiente.docente_id);
  const materiaLabel = materia ? etiquetaMateria(materia) : "materia";
  const grupoLabel = grupo?.nombre ?? "grupo";
  const docenteLabel = docente?.nombre?.trim() || "Docente sin nombre";
  return { materiaLabel, grupoLabel, docenteLabel };
}

function yieldEventLoop() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export async function resolverConBacktrack(
  ctx: ContextoProgramacion,
  log: string[],
  maxIntentos = ctx.config.max_intentos_backtrack,
  onProgreso?: OnProgresoGeneracion,
  signal?: AbortSignal,
) {
  const pendientes = ordenarMateriasPorPrioridad(ctx);
  const asignaciones: Asignacion[] = [];
  const fallos = new Map<string, Conflicto>();
  let intentos = 0;
  let ultimoIndiceReportado = -1;
  let ultimoReporteMs = 0;

  const ordenar = (slots: ReturnType<typeof generarSlots>) => slots.sort((a, b) => {
    const carga = (slot: typeof a) => asignaciones.filter((x) => x.grupo_id === slot.grupo_id && x.dia_semana === slot.dia).reduce((n, x) => n + (Number(x.hora_fin.slice(0, 2)) * 60 + Number(x.hora_fin.slice(3)) - Number(x.hora_inicio.slice(0, 2)) * 60 - Number(x.hora_inicio.slice(3))) / 60, 0);
    return carga(a) - carga(b) || a.dia - b.dia || a.hora_inicio.localeCompare(b.hora_inicio) || (a.espacio_id ?? "").localeCompare(b.espacio_id ?? "");
  });

  async function reportarProgreso(indice: number, forzar = false) {
    assertGeneracionNoCancelada(signal);
    if (!onProgreso || pendientes.length === 0) return;
    const ahora = Date.now();
    if (!forzar && indice === ultimoIndiceReportado && ahora - ultimoReporteMs < 250) return;
    ultimoIndiceReportado = indice;
    ultimoReporteMs = ahora;
    const pendiente = pendientes[Math.min(indice, pendientes.length - 1)];
    const { materiaLabel, grupoLabel } = etiquetaPendiente(pendiente, ctx);
    onProgreso({
      paso: "resolviendo",
      titulo: "Colocar sesiones",
      detalle: `${materiaLabel} · ${grupoLabel}`,
      actual: Math.min(indice + 1, pendientes.length),
      total: pendientes.length,
    });
    await yieldEventLoop();
    assertGeneracionNoCancelada(signal);
  }

  async function buscar(indice: number): Promise<boolean> {
    assertGeneracionNoCancelada(signal);
    if (indice === pendientes.length) return true;
    if (intentos >= maxIntentos) return false;
    const pendiente = pendientes[indice];
    const clave = `${pendiente.materia_id}:${pendiente.grupo_id}`;
    const { materiaLabel, grupoLabel, docenteLabel } = etiquetaPendiente(pendiente, ctx);
    await reportarProgreso(indice);
    if (!pendiente.docente_id) {
      fallos.set(clave, { regla: "CONFIGURACION", codigo: "DOCENTE_SIN_ASIGNAR", tipo: "error", mensaje: `La materia ${materiaLabel} no tiene docente asignado para el grupo ${grupoLabel} en este período.`, materia_id: pendiente.materia_id, grupo_id: pendiente.grupo_id });
      return false;
    }
    const candidatos = ordenar(generarSlots(pendiente, ctx));
    let ultimoFallo: Conflicto | undefined;
    for (const candidato of candidatos) {
      assertGeneracionNoCancelada(signal);
      if (pendiente.total_sesiones > 1 && asignaciones.some((a) => a.materia_id === pendiente.materia_id && a.grupo_id === pendiente.grupo_id && a.dia_semana === candidato.dia)) {
        ultimoFallo = { regla: "CALENDARIO", codigo: "SESIONES_MISMO_DIA", tipo: "error", mensaje: `Las dos sesiones semanales de ${materiaLabel} · ${grupoLabel} deben realizarse en días distintos.`, materia_id: pendiente.materia_id, grupo_id: pendiente.grupo_id, docente_id: pendiente.docente_id };
        continue;
      }
      const validacion = validarCandidato(candidato, ctx, asignaciones);
      if (!validacion.valida) { ultimoFallo = validacion.conflicto; continue; }
      intentos++;
      if (intentos % 2000 === 0) {
        await reportarProgreso(indice, true);
      }
      asignaciones.push({ horario_id: ctx.horario_id, materia_id: candidato.materia_id, grupo_id: candidato.grupo_id, docente_id: candidato.docente_id, espacio_id: candidato.espacio_id, modalidad: candidato.modalidad, dia_semana: candidato.dia, hora_inicio: candidato.hora_inicio, hora_fin: candidato.hora_fin, sede_id: candidato.sede_id });
      if (await buscar(indice + 1)) return true;
      asignaciones.pop();
    }
    fallos.set(clave, ultimoFallo ?? { regla: "PLANIFICADOR", codigo: "SIN_SLOTS_DISPONIBLES", tipo: "error", mensaje: `${docenteLabel}: no hay una franja válida para completar ${materiaLabel} · ${grupoLabel}.`, materia_id: pendiente.materia_id, grupo_id: pendiente.grupo_id, docente_id: pendiente.docente_id });
    return false;
  }

  assertGeneracionNoCancelada(signal);
  if (pendientes.length) {
    onProgreso?.({
      paso: "resolviendo",
      titulo: "Colocar sesiones",
      detalle: "Preparando búsqueda de franjas…",
      actual: 0,
      total: pendientes.length,
    });
    await yieldEventLoop();
    assertGeneracionNoCancelada(signal);
  }

  const exito = await buscar(0);
  if (!exito && intentos >= maxIntentos) log.push(`Se alcanzó el límite de exploración (${maxIntentos.toLocaleString()}) sin una solución completa.`);
  log.push(`Sesiones esperadas: ${pendientes.length}; exploraciones: ${intentos}.`);
  return { exito, asignaciones: exito ? asignaciones : [], conflictos: exito ? [] : [...fallos.values()] };
}
