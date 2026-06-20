import type { ReglaFn } from "../types";

export const rn10ClasesVirtuales: ReglaFn = (candidato, ctx, _asignadas) => {
  const materia = ctx.materias.find((m) => m.id === candidato.materia_id);

  if (!candidato.espacio_id) {
    // Es virtual
    if (materia && materia.modalidad === "presencial") {
      return {
        valida: false,
        conflicto: {
          regla: "RN10",
          codigo: "MATERIA_PRESENCIAL_NO_VIRTUAL",
          tipo: "error",
          mensaje: `La materia "${materia.nombre}" es presencial y no puede asignarse como virtual.`,
          materia_id: candidato.materia_id,
        },
      };
    }
    return { valida: true };
  }

  // Es presencial
  if (materia && materia.modalidad === "virtual") {
    return {
      valida: false,
      conflicto: {
        regla: "RN10",
        codigo: "MATERIA_VIRTUAL_NO_PRESENCIAL",
        tipo: "error",
        mensaje: `La materia "${materia.nombre}" es virtual y no debe ocupar un aula física.`,
        materia_id: candidato.materia_id,
        espacio_id: candidato.espacio_id,
      },
    };
  }

  return { valida: true };
};
