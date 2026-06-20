import type { ReglaFn } from "../types";

export const rn14BloquesTiempoOficina: ReglaFn = (candidato, ctx, _asignadas) => {
  const docente = ctx.docentes.find((d) => d.id === candidato.docente_id);
  if (!docente) {
    return {
      valida: false,
      conflicto: {
        regla: "RN14",
        codigo: "DOCENTE_NO_ENCONTRADO",
        tipo: "error",
        mensaje: "El docente no existe en el contexto de programación.",
        docente_id: candidato.docente_id,
      },
    };
  }

  const bloqueOficina = docente.disponibilidad.some(
    (b) =>
      b.dia_semana === candidato.dia &&
      b.es_tiempo_oficina &&
      b.hora_inicio < candidato.hora_fin &&
      b.hora_fin > candidato.hora_inicio
  );

  if (bloqueOficina) {
    return {
      valida: false,
      conflicto: {
        regla: "RN14",
        codigo: "BLOQUE_TIEMPO_OFICINA",
        tipo: "error",
        mensaje: "El bloque horario coincide con un bloque de tiempo oficina del docente.",
        docente_id: candidato.docente_id,
        dia: candidato.dia,
        hora_inicio: candidato.hora_inicio,
        hora_fin: candidato.hora_fin,
      },
    };
  }

  return { valida: true };
};
