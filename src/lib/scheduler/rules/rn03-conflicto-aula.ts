import type { ReglaFn } from "../types";

export const rn03ConflictoAula: ReglaFn = (candidato, _ctx, asignadas) => {
  if (!candidato.espacio_id) {
    return { valida: true };
  }

  const conflicto = asignadas.some(
    (a) =>
      a.espacio_id === candidato.espacio_id &&
      a.dia_semana === candidato.dia &&
      a.hora_inicio < candidato.hora_fin &&
      a.hora_fin > candidato.hora_inicio
  );

  if (conflicto) {
    return {
      valida: false,
      conflicto: {
        regla: "RN03",
        codigo: "AULA_OCUPADA",
        tipo: "error",
        mensaje: "El aula ya está ocupada en este bloque horario.",
        espacio_id: candidato.espacio_id,
        dia: candidato.dia,
        hora_inicio: candidato.hora_inicio,
        hora_fin: candidato.hora_fin,
      },
    };
  }

  return { valida: true };
};
