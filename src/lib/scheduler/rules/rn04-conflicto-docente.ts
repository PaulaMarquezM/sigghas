import type { ReglaFn } from "../types";

export const rn04ConflictoDocente: ReglaFn = (candidato, _ctx, asignadas) => {
  const conflicto = asignadas.some(
    (a) =>
      a.docente_id === candidato.docente_id &&
      a.dia_semana === candidato.dia &&
      a.hora_inicio < candidato.hora_fin &&
      a.hora_fin > candidato.hora_inicio
  );

  if (conflicto) {
    return {
      valida: false,
      conflicto: {
        regla: "RN04",
        codigo: "DOCENTE_OCUPADO",
        tipo: "error",
        mensaje: "El docente ya tiene una clase asignada en este bloque horario.",
        docente_id: candidato.docente_id,
        dia: candidato.dia,
        hora_inicio: candidato.hora_inicio,
        hora_fin: candidato.hora_fin,
      },
    };
  }

  return { valida: true };
};
