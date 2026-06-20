import type { ReglaFn } from "../types";

export const rn02Disponibilidad: ReglaFn = (candidato, ctx) => {
  const docente = ctx.docentes.find((d) => d.id === candidato.docente_id);
  if (!docente) {
    return {
      valida: false,
      conflicto: {
        regla: "RN02",
        codigo: "DOCENTE_NO_ENCONTRADO",
        tipo: "error",
        mensaje: "El docente no existe.",
        docente_id: candidato.docente_id,
      },
    };
  }

  const bloqueDisponible = docente.disponibilidad.some(
    (b) =>
      b.dia_semana === candidato.dia &&
      !b.es_tiempo_oficina &&
      b.hora_inicio <= candidato.hora_inicio &&
      b.hora_fin >= candidato.hora_fin
  );

  if (!bloqueDisponible) {
    return {
      valida: false,
      conflicto: {
        regla: "RN02",
        codigo: "DOCENTE_NO_DISPONIBLE",
        tipo: "error",
        mensaje:
          "El docente no tiene disponibilidad registrada para este bloque horario.",
        docente_id: candidato.docente_id,
        dia: candidato.dia,
        hora_inicio: candidato.hora_inicio,
        hora_fin: candidato.hora_fin,
      },
    };
  }

  return { valida: true };
};
