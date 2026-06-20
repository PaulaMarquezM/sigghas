import type { ReglaFn } from "../types";

const REQUIERE_LAB = new Map<string, boolean>();

export function setMateriasRequiereLab(materias: { id: string; requiere_laboratorio: boolean }[]) {
  REQUIERE_LAB.clear();
  materias.forEach((m) => REQUIERE_LAB.set(m.id, m.requiere_laboratorio));
}

export const rn06TipoEspacio: ReglaFn = (candidato, ctx, _asignadas) => {
  if (!candidato.espacio_id) {
    return { valida: true };
  }

  const espacio = ctx.espacios.find((e) => e.id === candidato.espacio_id);
  if (!espacio) {
    return { valida: false, conflicto: { regla: "RN06", codigo: "ESPACIO_NO_ENCONTRADO", tipo: "error", mensaje: "El espacio no existe.", espacio_id: candidato.espacio_id } };
  }

  const materia = ctx.materias.find((m) => m.id === candidato.materia_id);
  if (materia && materia.requiere_laboratorio && espacio.tipo !== "laboratorio") {
    return {
      valida: false,
      conflicto: {
        regla: "RN06",
        codigo: "REQUIERE_LABORATORIO",
        tipo: "error",
        mensaje: `La materia "${materia.nombre}" requiere laboratorio, pero se asignó a "${espacio.nombre}" (${espacio.tipo}).`,
        materia_id: candidato.materia_id,
        espacio_id: candidato.espacio_id,
      },
    };
  }

  return { valida: true };
};
