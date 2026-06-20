import type { ReglaFn } from "../types";

export const rn15RestriccionAccesibilidad: ReglaFn = (candidato, ctx, _asignadas) => {
  if (!candidato.espacio_id) {
    return { valida: true };
  }

  const grupo = ctx.grupos.find((g) => g.id === candidato.grupo_id);
  if (!grupo) {
    return {
      valida: false,
      conflicto: {
        regla: "RN15",
        codigo: "GRUPO_NO_ENCONTRADO",
        tipo: "error",
        mensaje: "El grupo no existe en el contexto de programación.",
        grupo_id: candidato.grupo_id,
      },
    };
  }

  if (!grupo.requiere_accesibilidad) {
    return { valida: true };
  }

  const espacio = ctx.espacios.find((e) => e.id === candidato.espacio_id);
  if (!espacio) {
    return {
      valida: false,
      conflicto: {
        regla: "RN15",
        codigo: "ESPACIO_NO_ENCONTRADO",
        tipo: "error",
        mensaje: "El espacio no existe en el contexto de programación.",
        espacio_id: candidato.espacio_id,
      },
    };
  }

  if (!espacio.accesible) {
    return {
      valida: false,
      conflicto: {
        regla: "RN15",
        codigo: "ESPACIO_NO_ACCESIBLE",
        tipo: "error",
        mensaje: `El grupo "${grupo.nombre}" requiere accesibilidad, pero "${espacio.nombre}" no es accesible.`,
        grupo_id: candidato.grupo_id,
        espacio_id: candidato.espacio_id,
      },
    };
  }

  return { valida: true };
};
