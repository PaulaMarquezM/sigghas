import type { ReglaFn } from "../types";

export const rn01HorasMaxDocente: ReglaFn = (candidato, ctx, asignadas) => {
  const docente = ctx.docentes.find((d) => d.id === candidato.docente_id);
  if (!docente) {
    return {
      valida: false,
      conflicto: {
        regla: "RN01",
        codigo: "DOCENTE_NO_ENCONTRADO",
        tipo: "error",
        mensaje: "El docente no existe en el contexto de programación.",
        docente_id: candidato.docente_id,
      },
    };
  }

  const horasBloque =
    (new Date(`1970-01-01T${candidato.hora_fin}`).getTime() -
      new Date(`1970-01-01T${candidato.hora_inicio}`).getTime()) /
    3600000;

  const horasAsignadas = asignadas
    .filter((a) => a.docente_id === candidato.docente_id)
    .reduce((sum, a) => {
      const h =
        (new Date(`1970-01-01T${a.hora_fin}`).getTime() -
          new Date(`1970-01-01T${a.hora_inicio}`).getTime()) /
        3600000;
      return sum + h;
    }, 0);

  if (horasAsignadas + horasBloque > docente.max_horas_semana) {
    return {
      valida: false,
      conflicto: {
        regla: "RN01",
        codigo: "EXCEDE_MAX_HORAS",
        tipo: "error",
        mensaje: `El docente excede el máximo de ${docente.max_horas_semana} horas semanales.`,
        docente_id: candidato.docente_id,
      },
    };
  }

  return { valida: true };
};
