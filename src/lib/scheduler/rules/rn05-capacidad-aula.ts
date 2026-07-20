import type { ReglaFn } from "../types";

export const rn05CapacidadAula: ReglaFn = (candidato, ctx) => {
  if (!candidato.espacio_id) {
    return { valida: true };
  }

  const espacio = ctx.espacios.find((e) => e.id === candidato.espacio_id);
  if (!espacio) {
    return { valida: false, conflicto: { regla: "RN05", codigo: "ESPACIO_NO_ENCONTRADO", tipo: "error", mensaje: "El espacio no existe.", espacio_id: candidato.espacio_id } };
  }

  if (!espacio.disponible) {
    return { valida: false, conflicto: { regla: "RN05", codigo: "ESPACIO_NO_DISPONIBLE", tipo: "error", mensaje: `El espacio "${espacio.nombre}" no está habilitado.`, espacio_id: candidato.espacio_id } };
  }

  const grupo = ctx.grupos.find((g) => g.id === candidato.grupo_id);
  if (grupo && espacio.capacidad < grupo.cantidad_estudiantes) {
    return {
      valida: false,
      conflicto: {
        regla: "RN05",
        codigo: "CAPACIDAD_INSUFICIENTE",
        tipo: "error",
        mensaje: `El espacio "${espacio.nombre}" tiene capacidad para ${espacio.capacidad} estudiantes, pero el grupo "${grupo.nombre}" tiene ${grupo.cantidad_estudiantes}.`,
        espacio_id: candidato.espacio_id,
        grupo_id: candidato.grupo_id,
      },
    };
  }

  return { valida: true };
};
