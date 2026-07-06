import type { Slot, Asignacion, ContextoProgramacion, Conflicto, DiaSemana } from "./types";
import { validateSlot } from "./rules/index";

interface AsignacionPendiente {
  materia_id: string;
  grupo_id: string;
  horas_requeridas: number;
  requiere_laboratorio: boolean;
  semestre: number;
}

export function ordenarMateriasPorPrioridad(ctx: ContextoProgramacion): AsignacionPendiente[] {
  const pendientes: AsignacionPendiente[] = [];

  for (const materia of ctx.materias) {
    const gruposParaMateria = ctx.grupos.filter(
      (g) => g.semestre === materia.semestre && g.activo
    );

    for (const grupo of gruposParaMateria) {
      pendientes.push({
        materia_id: materia.id,
        grupo_id: grupo.id,
        horas_requeridas: materia.horas_semana,
        requiere_laboratorio: materia.requiere_laboratorio,
        semestre: materia.semestre,
      });
    }
  }

  pendientes.sort((a, b) => {
    if (a.requiere_laboratorio !== b.requiere_laboratorio) return b.requiere_laboratorio ? 1 : -1;
    if (a.semestre !== b.semestre) return b.semestre - a.semestre;
    if (a.horas_requeridas !== b.horas_requeridas) return b.horas_requeridas - a.horas_requeridas;
    return 0;
  });

  return pendientes;
}

export function generarSlots(
  pendiente: AsignacionPendiente,
  ctx: ContextoProgramacion
): Slot[] {
  const slots: Slot[] = [];

  const requiereLab = pendiente.requiere_laboratorio;

  const espaciosCandidatos = ctx.espacios.filter(
    (e) =>
      e.disponible &&
      e.sede_id === getSedeGrupo(pendiente.grupo_id, ctx)
  );

  for (const dia of ctx.config.dias_laborables) {
    const bloques = generarBloques(dia, ctx);

    for (const bloque of bloques) {
      const docentesCandidatos = ctx.docentes.filter((d) =>
        d.disponibilidad.some(
          (b) =>
            b.dia_semana === dia &&
            !b.es_tiempo_oficina &&
            b.hora_inicio <= bloque.hora_inicio &&
            b.hora_fin >= bloque.hora_fin
        )
      );

      for (const docente of docentesCandidatos) {
        if (requiereLab && espaciosCandidatos.length > 0) {
          for (const espacio of espaciosCandidatos.filter((e) => e.tipo === "laboratorio")) {
            slots.push({
              materia_id: pendiente.materia_id,
              grupo_id: pendiente.grupo_id,
              dia,
              hora_inicio: bloque.hora_inicio,
              hora_fin: bloque.hora_fin,
              docente_id: docente.id,
              espacio_id: espacio.id,
              sede_id: espacio.sede_id,
              modalidad: "presencial",
            });
          }
        } else {
          for (const espacio of espaciosCandidatos) {
            slots.push({
              materia_id: pendiente.materia_id,
              grupo_id: pendiente.grupo_id,
              dia,
              hora_inicio: bloque.hora_inicio,
              hora_fin: bloque.hora_fin,
              docente_id: docente.id,
              espacio_id: espacio.id,
              sede_id: espacio.sede_id,
              modalidad: "presencial",
            });
          }

          slots.push({
            materia_id: pendiente.materia_id,
            grupo_id: pendiente.grupo_id,
            dia,
            hora_inicio: bloque.hora_inicio,
            hora_fin: bloque.hora_fin,
            docente_id: docente.id,
            espacio_id: null,
            sede_id: getSedeGrupo(pendiente.grupo_id, ctx),
            modalidad: "virtual",
          });
        }
      }
    }
  }

  return slots;
}

export function mejorSlot(
  slots: Slot[],
  _ctx: ContextoProgramacion,
  _asignadas: Asignacion[]
): Slot | null {
  if (slots.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * Math.min(slots.length, 3));
  return slots[randomIndex];
}

export function asignarPorGreedy(
  ctx: ContextoProgramacion,
  log: string[]
): {
  asignaciones: Asignacion[];
  conflictos: Conflicto[];
} {
  const pendientes = ordenarMateriasPorPrioridad(ctx);
  const asignaciones: Asignacion[] = [];
  const conflictos: Conflicto[] = [];

  for (const pendiente of pendientes) {
    const materia = ctx.materias.find((m) => m.id === pendiente.materia_id);
    const grupo = ctx.grupos.find((g) => g.id === pendiente.grupo_id);

    log.push(`Asignando: ${materia?.nombre ?? pendiente.materia_id} → ${grupo?.nombre ?? pendiente.grupo_id}`);

    const slots = generarSlots(pendiente, ctx);

    const slotsValidos = slots.filter((s) => {
      const resultado = validateSlot(s, ctx, asignaciones);
      return resultado.valida;
    });

    if (slotsValidos.length === 0) {
      log.push(`  ❌ Sin slots válidos para ${materia?.nombre ?? ""}`);
      conflictos.push({
        regla: "SIN_SLOTS",
        codigo: "SIN_SLOTS_DISPONIBLES",
        tipo: "error",
        mensaje: `No hay slots disponibles para ${materia?.nombre ?? pendiente.materia_id} - ${grupo?.nombre ?? pendiente.grupo_id}`,
        materia_id: pendiente.materia_id,
        grupo_id: pendiente.grupo_id,
      });
      continue;
    }

    const seleccionado = mejorSlot(slotsValidos, ctx, asignaciones);
    if (!seleccionado) {
      log.push(`  ❌ No se pudo seleccionar slot`);
      continue;
    }

    asignaciones.push({
      horario_id: ctx.horario_id,
      materia_id: pendiente.materia_id,
      docente_id: seleccionado.docente_id,
      grupo_id: pendiente.grupo_id,
      espacio_id: seleccionado.espacio_id,
      modalidad: seleccionado.modalidad,
      dia_semana: seleccionado.dia,
      hora_inicio: seleccionado.hora_inicio,
      hora_fin: seleccionado.hora_fin,
      sede_id: seleccionado.sede_id,
    });

    const horas = horasEntre(seleccionado.hora_inicio, seleccionado.hora_fin);
    log.push(`  ✅ ${diasemanaLabel(seleccionado.dia)} ${seleccionado.hora_inicio}-${seleccionado.hora_fin} (${horas}h)`);
  }

  return { asignaciones, conflictos };
}

function getSedeGrupo(grupoId: string, ctx: ContextoProgramacion): string {
  const grupo = ctx.grupos.find((g) => g.id === grupoId);
  return grupo?.sede_id ?? "";
}

interface BloqueHorario {
  hora_inicio: string;
  hora_fin: string;
}

function generarBloques(dia: DiaSemana, ctx: ContextoProgramacion): BloqueHorario[] {
  const bloques: BloqueHorario[] = [];
  const inicio = parseTime(ctx.config.hora_inicio_jornada);
  const fin = parseTime(ctx.config.hora_fin_jornada);
  const duracion = ctx.config.duracion_bloque_minutos;

  let current = inicio;
  while (current + duracion <= fin) {
    bloques.push({
      hora_inicio: formatTime(current),
      hora_fin: formatTime(current + duracion),
    });
    current += duracion;
  }

  return bloques;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function horasEntre(inicio: string, fin: string): number {
  return (parseTime(fin) - parseTime(inicio)) / 60;
}

function diasemanaLabel(dia: DiaSemana): string {
  const labels: Record<DiaSemana, string> = {
    1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb",
  };
  return labels[dia];
}
