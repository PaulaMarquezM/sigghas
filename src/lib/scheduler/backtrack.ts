import type { Asignacion, ContextoProgramacion, Conflicto } from "./types";
import { generarSlots, ordenarMateriasPorPrioridad } from "./greedy";
import { validateSlot } from "./rules/index";

export function resolverConBacktrack(
  ctx: ContextoProgramacion,
  log: string[],
  maxIntentos: number
): {
  asignaciones: Asignacion[];
  conflictos: Conflicto[];
  exito: boolean;
} {
  const pendientes = ordenarMateriasPorPrioridad(ctx);
  const asignaciones: Asignacion[] = [];
  const conflictos: Conflicto[] = [];
  let intentos = 0;

  function backtrack(indice: number): boolean {
    if (intentos >= maxIntentos) return false;
    if (indice >= pendientes.length) return true;

    intentos++;
    const pendiente = pendientes[indice];
    const materia = ctx.materias.find((m) => m.id === pendiente.materia_id);
    const grupo = ctx.grupos.find((g) => g.id === pendiente.grupo_id);

    log.push(`Backtrack [${intentos}]: ${materia?.nombre ?? ""} → ${grupo?.nombre ?? ""}`);

    const slots = generarSlots(pendiente, ctx);

    const slotsOrdenados = slots
      .map((s) => ({ slot: s, valido: validateSlot(s, ctx, asignaciones) }))
      .filter((s) => s.valido.valida)
      .sort(() => 0);

    for (const candidato of slotsOrdenados) {
      const nuevaAsignacion: Asignacion = {
        horario_id: ctx.horario_id,
        materia_id: pendiente.materia_id,
        docente_id: candidato.slot.docente_id,
        grupo_id: pendiente.grupo_id,
        espacio_id: candidato.slot.espacio_id,
        modalidad: candidato.slot.modalidad,
        dia_semana: candidato.slot.dia,
        hora_inicio: candidato.slot.hora_inicio,
        hora_fin: candidato.slot.hora_fin,
        sede_id: candidato.slot.sede_id,
      };

      asignaciones.push(nuevaAsignacion);

      const horas = horasEntre(candidato.slot.hora_inicio, candidato.slot.hora_fin);
      log.push(`  🔄 Probando: ${diasemanaLabel(candidato.slot.dia)} ${candidato.slot.hora_inicio}-${candidato.slot.hora_fin} (${horas}h)`);

      if (backtrack(indice + 1)) return true;

      asignaciones.pop();
      log.push(`  ↩️  Retrocediendo: ${materia?.nombre ?? ""}`);
    }

    log.push(`  ❌ Sin opciones para ${materia?.nombre ?? ""} (intento ${intentos})`);
    conflictos.push({
      regla: "BACKTRACK",
      codigo: "SIN_SOLUCION",
      tipo: "error",
      mensaje: `No se encontró slot válido para ${materia?.nombre ?? pendiente.materia_id} después de ${intentos} intentos`,
      materia_id: pendiente.materia_id,
      grupo_id: pendiente.grupo_id,
    });

    return false;
  }

  const exito = backtrack(0);

  return { asignaciones, conflictos, exito };
}

function horasEntre(inicio: string, fin: string): number {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
}

function diasemanaLabel(dia: number): string {
  const labels: Record<number, string> = {
    1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb",
  };
  return labels[dia] ?? "?";
}
