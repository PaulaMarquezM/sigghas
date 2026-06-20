import type { ReglaFn, Asignacion } from "../types";

const MATERIAS_LAB = new Set<string>();

export function setMateriasLab(ids: string[]) {
  MATERIAS_LAB.clear();
  ids.forEach((id) => MATERIAS_LAB.add(id));
}

function horasEntre(inicio: string, fin: string): number {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
}

function bloquesContiguos(asignadas: Asignacion[], materiaId: string, grupoId: string, dia: number): number {
  const delGrupo = asignadas.filter(
    (a) => a.materia_id === materiaId && a.grupo_id === grupoId && a.dia_semana === dia
  );
  if (delGrupo.length === 0) return 0;

  const sorted = delGrupo.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  let contiguas = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].hora_inicio === sorted[i - 1].hora_fin) {
      contiguas++;
    }
  }
  return contiguas;
}

export const rn07BloquesContiguos: ReglaFn = (candidato, ctx, asignadas) => {
  const materia = ctx.materias.find((m) => m.id === candidato.materia_id);

  // Si la materia tiene horas prácticas, deben ir en bloques contiguos
  if (materia && materia.horas_practica > 0) {
    const horas = horasEntre(candidato.hora_inicio, candidato.hora_fin);
    if (horas < materia.horas_practica) {
      // Verificar si el slot candidato es contiguo a las ya asignadas
      const contiguas = bloquesContiguos(asignadas, candidato.materia_id, candidato.grupo_id, candidato.dia);
      const sinAsignar = materia.horas_practica / 60 - contiguas - horas;

      if (sinAsignar > 0) {
        return {
          valida: false,
          conflicto: {
            regla: "RN07",
            codigo: "BLOQUES_NO_CONTIGUOS",
            tipo: "error",
            mensaje: `La materia "${materia.nombre}" requiere ${materia.horas_practica}h prácticas en bloques contiguos.`,
            materia_id: candidato.materia_id,
            grupo_id: candidato.grupo_id,
            dia: candidato.dia,
          },
        };
      }
    }
  }

  return { valida: true };
};
