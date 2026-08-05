import type { Asignacion, ContextoProgramacion, DiaSemana, ReglaResultado, Slot } from "./types";

export interface AsignacionPendiente {
  materia_id: string;
  grupo_id: string;
  docente_id: string;
  duracion_horas: number;
  indice_sesion: number;
  total_sesiones: number;
}

const minutos = (hora: string) => {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};
const hora = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const duracion = (inicio: string, fin: string) => (minutos(fin) - minutos(inicio)) / 60;
const seSolapan = (aInicio: string, aFin: string, bInicio: string, bFin: string) =>
  minutos(aInicio) < minutos(bFin) && minutos(aFin) > minutos(bInicio);
const esPresencial = (modalidad: Slot["modalidad"]) => modalidad === "presencial";

export function distribuirHoras(horas: number): number[] {
  if (horas <= 3.5) return [horas];
  const primera = Math.ceil((horas / 2) * 2) / 2;
  return [primera, horas - primera];
}

export function ordenarMateriasPorPrioridad(ctx: ContextoProgramacion): AsignacionPendiente[] {
  const asignaciones = new Map(
    (ctx.asignaciones_docente ?? []).map((a) => [`${a.materia_id}:${a.grupo_id}`, a.docente_id])
  );
  const pendientes: AsignacionPendiente[] = [];
  for (const materia of ctx.materias.filter((m) => m.activo)) {
    for (const grupo of ctx.grupos.filter((g) => g.activo && g.semestre === materia.semestre)) {
      const docente_id = asignaciones.get(`${materia.id}:${grupo.id}`) ?? "";
      distribuirHoras(Number(materia.horas_semana)).forEach((duracion_horas, indice_sesion, sesiones) => {
        pendientes.push({ materia_id: materia.id, grupo_id: grupo.id, docente_id, duracion_horas, indice_sesion, total_sesiones: sesiones.length });
      });
    }
  }
  return pendientes.sort((a, b) => {
    const ma = ctx.materias.find((m) => m.id === a.materia_id)!;
    const mb = ctx.materias.find((m) => m.id === b.materia_id)!;
    if (ma.requiere_laboratorio !== mb.requiere_laboratorio) return ma.requiere_laboratorio ? -1 : 1;
    if (a.duracion_horas !== b.duracion_horas) return b.duracion_horas - a.duracion_horas;
    return `${a.materia_id}:${a.grupo_id}:${a.indice_sesion}`.localeCompare(`${b.materia_id}:${b.grupo_id}:${b.indice_sesion}`);
  });
}

function diasPermitidos(pendiente: AsignacionPendiente, ctx: ContextoProgramacion): DiaSemana[] {
  const grupo = ctx.grupos.find((g) => g.id === pendiente.grupo_id);
  return grupo && (grupo.semestre === 7 || grupo.semestre === 8)
    ? [...ctx.config.dias_laborables, 6]
    : ctx.config.dias_laborables;
}

function espacioDisponible(espacioId: string, dia: DiaSemana, inicio: string, fin: string, ctx: ContextoProgramacion) {
  return !(ctx.disponibilidad_espacio ?? []).some((bloque) =>
    bloque.espacio_id === espacioId && bloque.dia_semana === dia && !bloque.disponible &&
    seSolapan(inicio, fin, bloque.hora_inicio, bloque.hora_fin)
  );
}

export function generarSlots(pendiente: AsignacionPendiente, ctx: ContextoProgramacion): Slot[] {
  if (!pendiente.docente_id || pendiente.duracion_horas > 3.5) return [];
  const materia = ctx.materias.find((m) => m.id === pendiente.materia_id);
  const grupo = ctx.grupos.find((g) => g.id === pendiente.grupo_id);
  if (!materia || !grupo) return [];
  const finSesionOffset = pendiente.duracion_horas * 60;
  const espacios = materia.modalidad === "presencial"
    ? ctx.espacios.filter((e) => e.disponible && e.activo && e.sede_id === grupo.sede_id && e.capacidad >= grupo.cantidad_estudiantes)
        .filter((e) => materia.requiere_laboratorio ? e.tipo === "laboratorio" : true)
        .sort((a, b) => {
          const tipo = materia.requiere_laboratorio ? 0 : (a.tipo === "aula" ? 0 : 1) - (b.tipo === "aula" ? 0 : 1);
          return tipo || a.capacidad - b.capacidad || a.nombre.localeCompare(b.nombre);
        })
    : [];
  const slots: Slot[] = [];
  for (const dia of diasPermitidos(pendiente, ctx)) {
    for (const [tramoInicio, tramoFin] of [[minutos(ctx.config.hora_inicio_jornada), minutos(ctx.config.hora_inicio_receso ?? "12:00")], [minutos(ctx.config.hora_fin_receso ?? "14:00"), minutos(ctx.config.hora_fin_jornada)]]) {
      for (let inicio = tramoInicio; inicio + finSesionOffset <= tramoFin; inicio += ctx.config.duracion_bloque_minutos) {
        const horaInicio = hora(inicio);
        const horaFin = hora(inicio + finSesionOffset);
        if (materia.modalidad === "presencial") {
          for (const espacio of espacios) {
            if (espacioDisponible(espacio.id, dia, horaInicio, horaFin, ctx)) {
              slots.push({ materia_id: materia.id, grupo_id: grupo.id, docente_id: pendiente.docente_id, dia, hora_inicio: horaInicio, hora_fin: horaFin, espacio_id: espacio.id, sede_id: grupo.sede_id, modalidad: materia.modalidad });
            }
          }
        } else {
          slots.push({ materia_id: materia.id, grupo_id: grupo.id, docente_id: pendiente.docente_id, dia, hora_inicio: horaInicio, hora_fin: horaFin, espacio_id: null, sede_id: grupo.sede_id, modalidad: materia.modalidad });
        }
      }
    }
  }
  return slots;
}

function horasDocente(asignadas: Asignacion[], docenteId: string, dia?: DiaSemana) {
  const vistas = new Set<string>();
  return asignadas.filter((a) => a.docente_id === docenteId && (dia === undefined || a.dia_semana === dia)).reduce((total, a) => {
    const clave = `${a.materia_id}:${a.docente_id}:${a.dia_semana}:${a.hora_inicio}:${a.hora_fin}`;
    if (vistas.has(clave)) return total;
    vistas.add(clave);
    return total + duracion(a.hora_inicio, a.hora_fin);
  }, 0);
}

export function validarCandidato(candidato: Slot, ctx: ContextoProgramacion, asignadas: Asignacion[]): ReglaResultado {
  const docente = ctx.docentes.find((d) => d.id === candidato.docente_id);
  const grupo = ctx.grupos.find((g) => g.id === candidato.grupo_id);
  const materia = ctx.materias.find((m) => m.id === candidato.materia_id);
  const fallo = (codigo: string, mensaje: string): ReglaResultado => ({ valida: false, conflicto: { regla: "PLANIFICADOR", codigo, tipo: "error", mensaje, materia_id: candidato.materia_id, grupo_id: candidato.grupo_id, docente_id: candidato.docente_id, espacio_id: candidato.espacio_id ?? undefined, dia: candidato.dia, hora_inicio: candidato.hora_inicio, hora_fin: candidato.hora_fin } });
  if (!docente || !grupo || !materia) return fallo("CONFIGURACION_INCOMPLETA", "Falta docente, grupo o materia en la configuración.");
  if (minutos(candidato.hora_inicio) % 30 || minutos(candidato.hora_fin) % 30 || duracion(candidato.hora_inicio, candidato.hora_fin) > 3.5) return fallo("FRANJA_INVALIDA", "La sesión debe usar franjas de 30 minutos y durar como máximo 3 h 30 min.");
  if (candidato.dia === 6 && grupo.semestre !== 7 && grupo.semestre !== 8) return fallo("SABADO_NO_PERMITIDO", "Solo los grupos de 7.º y 8.º semestre pueden tener clases el sábado.");
  if (candidato.modalidad === "presencial" && (docente.sede_ids ?? []).length > 0 && !(docente.sede_ids ?? []).includes(candidato.sede_id)) {
    return fallo("DOCENTE_SEDE_NO_HABILITADA", "El docente no est\\u00e1 habilitado para impartir clases en la sede de este curso.");
  }
  const disponible = docente.disponibilidad.some((b) => b.dia_semana === candidato.dia && !b.es_tiempo_oficina && b.hora_inicio <= candidato.hora_inicio && b.hora_fin >= candidato.hora_fin);
  const oficina = docente.disponibilidad.some((b) => b.dia_semana === candidato.dia && b.es_tiempo_oficina && seSolapan(candidato.hora_inicio, candidato.hora_fin, b.hora_inicio, b.hora_fin));
  if (!disponible || oficina) return fallo("DOCENTE_NO_DISPONIBLE", "El docente no está disponible para toda la sesión o tiene tiempo de oficina.");
  const compartida = (a: Asignacion) => !esPresencial(a.modalidad) && !esPresencial(candidato.modalidad) && a.docente_id === candidato.docente_id && a.materia_id === candidato.materia_id && a.dia_semana === candidato.dia && a.hora_inicio === candidato.hora_inicio && a.hora_fin === candidato.hora_fin;
  const yaCompartida = asignadas.some(compartida);
  const cargaNueva = yaCompartida ? 0 : duracion(candidato.hora_inicio, candidato.hora_fin);
  if (horasDocente(asignadas, docente.id) + cargaNueva > docente.max_horas_semana) return fallo("EXCEDE_MAX_HORAS", "La sesión excede la carga semanal del docente.");
  if (horasDocente(asignadas, docente.id, candidato.dia) + cargaNueva > (ctx.config.max_horas_diarias ?? 6)) return fallo("EXCEDE_MAX_HORAS_DIARIAS", "La sesión excede el máximo diario de 6 horas del docente.");
  if (asignadas.filter((a) => a.grupo_id === grupo.id && a.dia_semana === candidato.dia).reduce((s, a) => s + duracion(a.hora_inicio, a.hora_fin), 0) + duracion(candidato.hora_inicio, candidato.hora_fin) > (ctx.config.max_horas_diarias ?? 6)) return fallo("GRUPO_EXCEDE_MAX_HORAS_DIARIAS", "El grupo excede el máximo diario de 6 horas.");
  for (const asignada of asignadas) {
    if (asignada.grupo_id === candidato.grupo_id && asignada.dia_semana === candidato.dia && seSolapan(asignada.hora_inicio, asignada.hora_fin, candidato.hora_inicio, candidato.hora_fin)) return fallo("GRUPO_OCUPADO", "El grupo ya tiene una sesión en esta franja.");
    if (asignada.docente_id === candidato.docente_id && asignada.dia_semana === candidato.dia && seSolapan(asignada.hora_inicio, asignada.hora_fin, candidato.hora_inicio, candidato.hora_fin) && !compartida(asignada)) return fallo("DOCENTE_OCUPADO", "El docente ya tiene otra sesión en esta franja.");
    if (candidato.espacio_id && asignada.espacio_id === candidato.espacio_id && asignada.dia_semana === candidato.dia && seSolapan(asignada.hora_inicio, asignada.hora_fin, candidato.hora_inicio, candidato.hora_fin)) return fallo("ESPACIO_OCUPADO", "El espacio ya está ocupado en esta franja.");
    const mismaPersonaOGrupo = (asignada.grupo_id === candidato.grupo_id || asignada.docente_id === candidato.docente_id) && asignada.dia_semana === candidato.dia;
    if (mismaPersonaOGrupo && (esPresencial(asignada.modalidad) || esPresencial(candidato.modalidad)) && !compartida(asignada)) {
      const distancia = Math.max(minutos(asignada.hora_inicio), minutos(candidato.hora_inicio)) - Math.min(minutos(asignada.hora_fin), minutos(candidato.hora_fin));
      if (distancia < (ctx.config.separacion_presencial_minutos ?? 120)) return fallo("DESCANSO_INSUFICIENTE", "Se requieren al menos 2 horas entre sesiones cuando una de ellas es presencial.");
    }
  }
  if (esPresencial(candidato.modalidad)) {
    const otraSede = asignadas.some((a) => a.docente_id === candidato.docente_id && a.dia_semana === candidato.dia && esPresencial(a.modalidad) && a.sede_id !== candidato.sede_id);
    if (otraSede) return fallo("DOCENTE_DOS_SEDES", "El docente no puede dictar presencialmente en dos sedes el mismo día.");
  }
  if (candidato.modalidad === "presencial" && !candidato.espacio_id) return fallo("ESPACIO_REQUERIDO", "Una materia presencial requiere un espacio físico.");
  if (candidato.modalidad !== "presencial" && candidato.espacio_id) return fallo("ESPACIO_NO_PERMITIDO", "Las materias virtuales e híbridas no reservan un espacio físico.");
  if (materia.modalidad !== candidato.modalidad) return fallo("MODALIDAD_INVALIDA", "La modalidad no coincide con la configurada en la materia.");
  return { valida: true };
}
