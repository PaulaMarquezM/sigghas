import type { ReglaFn } from "../types";

export const rn11DocenteDosSedes: ReglaFn = (candidato, _ctx, asignadas) => {
  const asignacionesMismoDia = asignadas.filter(
    (a) =>
      a.docente_id === candidato.docente_id &&
      a.dia_semana === candidato.dia
  );

  const tieneOtraSede = asignacionesMismoDia.some(
    (a) => a.sede_id !== candidato.sede_id
  );

  if (tieneOtraSede) {
    return {
      valida: false,
      conflicto: {
        regla: "RN11",
        codigo: "DOCENTE_DOS_SEDES",
        tipo: "error",
        mensaje: "El docente no puede dar clases presenciales en dos sedes el mismo día.",
        docente_id: candidato.docente_id,
        dia: candidato.dia,
      },
    };
  }

  return { valida: true };
};
