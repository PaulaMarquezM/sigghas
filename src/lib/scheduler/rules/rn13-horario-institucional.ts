import type { ReglaFn } from "../types";

export const rn13HorarioInstitucional: ReglaFn = (candidato, ctx, _asignadas) => {
  const docente = ctx.docentes.find((d) => d.id === candidato.docente_id);
  if (!docente) {
    return {
      valida: false,
      conflicto: {
        regla: "RN13",
        codigo: "DOCENTE_NO_ENCONTRADO",
        tipo: "error",
        mensaje: "El docente no existe en el contexto de programación.",
        docente_id: candidato.docente_id,
      },
    };
  }

  const esTC = docente.tipo_contrato === "tiempo_completo" || docente.tipo_contrato === "titular";
  if (!esTC) {
    return { valida: true };
  }

  if (!docente.hora_entrada || !docente.hora_salida) {
    return {
      valida: false,
      conflicto: {
        regla: "RN13",
        codigo: "SIN_HORARIO_INSTITUCIONAL",
        tipo: "error",
        mensaje: "El docente de tiempo completo no tiene horario institucional configurado.",
        docente_id: candidato.docente_id,
      },
    };
  }

  if (candidato.hora_inicio < docente.hora_entrada || candidato.hora_fin > docente.hora_salida) {
    return {
      valida: false,
      conflicto: {
        regla: "RN13",
        codigo: "FUERA_DE_HORARIO_INSTITUCIONAL",
        tipo: "error",
        mensaje: `La asignación está fuera del horario institucional del docente (${docente.hora_entrada}-${docente.hora_salida}).`,
        docente_id: candidato.docente_id,
        hora_inicio: candidato.hora_inicio,
        hora_fin: candidato.hora_fin,
      },
    };
  }

  return { valida: true };
};
