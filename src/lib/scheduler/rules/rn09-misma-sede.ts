import type { ReglaFn } from "../types";

export const rn09MismaSede: ReglaFn = (candidato, ctx) => {
  if (!candidato.espacio_id) {
    // Clase virtual: no ocupa espacio físico, la sede del grupo no aplica.
    return { valida: true };
  }

  const grupo = ctx.grupos.find((g) => g.id === candidato.grupo_id);
  if (!grupo) {
    return { valida: false, conflicto: { regla: "RN09", codigo: "GRUPO_NO_ENCONTRADO", tipo: "error", mensaje: "El grupo no existe." } };
  }

  if (grupo.sede_id !== candidato.sede_id) {
    return {
      valida: false,
      conflicto: {
        regla: "RN09",
        codigo: "SEDE_INCORRECTA",
        tipo: "error",
        mensaje: `El grupo pertenece a una sede diferente.`,
        grupo_id: candidato.grupo_id,
      },
    };
  }

  return { valida: true };
};
