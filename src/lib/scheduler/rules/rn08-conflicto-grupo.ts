import type { ReglaFn } from "../types";

export const rn08ConflictoGrupo: ReglaFn = (candidato, _ctx, asignadas) => {
  const conflicto = asignadas.some(
    (a) =>
      a.grupo_id === candidato.grupo_id &&
      a.dia_semana === candidato.dia &&
      a.hora_inicio < candidato.hora_fin &&
      a.hora_fin > candidato.hora_inicio
  );

  if (conflicto) {
    return {
      valida: false,
      conflicto: {
        regla: "RN08",
        codigo: "GRUPO_OCUPADO",
        tipo: "error",
        mensaje: "El grupo ya tiene una materia asignada en este bloque horario.",
        grupo_id: candidato.grupo_id,
        dia: candidato.dia,
        hora_inicio: candidato.hora_inicio,
        hora_fin: candidato.hora_fin,
      },
    };
  }

  return { valida: true };
};
