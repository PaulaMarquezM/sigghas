import type { ReglaFn } from "../types";

export const rn16SesionesVirtualesCompartidas: ReglaFn = (candidato, ctx, asignadas) => {
  if (candidato.espacio_id) {
    return { valida: true };
  }

  const sesionesVirtualesMismoHorario = asignadas.filter(
    (a) =>
      !a.espacio_id &&
      a.dia_semana === candidato.dia &&
      a.hora_inicio < candidato.hora_fin &&
      a.hora_fin > candidato.hora_inicio &&
      (a.docente_id === candidato.docente_id || a.materia_id === candidato.materia_id)
  );

  if (sesionesVirtualesMismoHorario.length > 0) {
    const mismoDocenteYMateria = sesionesVirtualesMismoHorario.some(
      (a) => a.docente_id === candidato.docente_id && a.materia_id === candidato.materia_id
    );

    if (!mismoDocenteYMateria) {
      // Es conflicto: misma hora, virtual, pero diferente materia o docente
      const conflicto = sesionesVirtualesMismoHorario.find(
        (a) => a.docente_id === candidato.docente_id && a.materia_id !== candidato.materia_id
      );
      if (conflicto) {
        return {
          valida: false,
          conflicto: {
            regla: "RN16",
            codigo: "DOCENTE_DOS_VIRTUALES",
            tipo: "error",
            mensaje: "El docente no puede impartir dos sesiones virtuales diferentes en el mismo horario.",
            docente_id: candidato.docente_id,
            dia: candidato.dia,
            hora_inicio: candidato.hora_inicio,
            hora_fin: candidato.hora_fin,
          },
        };
      }
    }
  }

  return { valida: true };
};
