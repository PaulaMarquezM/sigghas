import type { ReglaFn } from "../types";

export const rn12RestriccionTipoContrato: ReglaFn = (candidato, ctx, _asignadas) => {
  const docente = ctx.docentes.find((d) => d.id === candidato.docente_id);
  if (!docente) {
    return {
      valida: false,
      conflicto: {
        regla: "RN12",
        codigo: "DOCENTE_NO_ENCONTRADO",
        tipo: "error",
        mensaje: "El docente no existe en el contexto de programación.",
        docente_id: candidato.docente_id,
      },
    };
  }

  if (docente.tipo_contrato === "por_horas" || docente.tipo_contrato === "honorarios") {
    const horaInicio = candidato.hora_inicio;
    const horaFin = candidato.hora_fin;

    if (horaInicio < "07:00" || horaFin > "19:00") {
      return {
        valida: false,
        conflicto: {
          regla: "RN12",
          codigo: "FUERA_DE_HORARIO_CONTRATADO",
          tipo: "error",
          mensaje: "Los docentes por horas/honorarios solo pueden asignarse entre 07:00 y 19:00.",
          docente_id: candidato.docente_id,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
        },
      };
    }
  }

  return { valida: true };
};
