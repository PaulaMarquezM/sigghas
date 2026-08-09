/* eslint-disable @typescript-eslint/no-explicit-any */

export type PaginaHorarioPDF = {
  etiqueta: string;
  semestre: number;
  sedeId: string;
  sedeNombre: string;
  sesiones: any[];
};

type BucketInterno = PaginaHorarioPDF & { esCentral: boolean };

/**
 * Agrupa sesiones por (semestre del curso, sede), omite vacíos y ordena
 * semestre ASC → sede central primero → nombre de sede ASC.
 */
export function groupSesionesBySemestreSede(sesiones: any[]): PaginaHorarioPDF[] {
  const buckets = new Map<string, BucketInterno>();

  for (const sesion of sesiones) {
    const grupo = sesion.grupos;
    const semestre = Number(grupo?.semestre);
    const sedeId = String(grupo?.sede_id ?? sesion.sede_id ?? "");
    const sede = grupo?.sedes;
    const sedeNombre = String(sede?.nombre ?? "Sin sede");
    const esCentral = Boolean(sede?.es_central);

    if (!Number.isFinite(semestre) || semestre <= 0 || !sedeId) continue;

    const key = `${semestre}|${sedeId}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        etiqueta: `${semestre}.º semestre · ${sedeNombre}`,
        semestre,
        sedeId,
        sedeNombre,
        esCentral,
        sesiones: [],
      };
      buckets.set(key, bucket);
    }
    bucket.sesiones.push(sesion);
  }

  return Array.from(buckets.values())
    .filter((pagina) => pagina.sesiones.length > 0)
    .sort((a, b) => {
      if (a.semestre !== b.semestre) return a.semestre - b.semestre;
      if (a.esCentral !== b.esCentral) return a.esCentral ? -1 : 1;
      return a.sedeNombre.localeCompare(b.sedeNombre, "es");
    })
    .map(({ etiqueta, semestre, sedeId, sedeNombre, sesiones }) => ({
      etiqueta,
      semestre,
      sedeId,
      sedeNombre,
      sesiones,
    }));
}

/** Normaliza el periodo (ej. "2026-I" / "2026 - 2") para el nombre del archivo. */
export function slugPeriodoParaArchivo(periodoNombre: string): string {
  return periodoNombre
    .trim()
    .replace(/\s+/g, "")
    .replace(/-III$/i, "-3")
    .replace(/-II$/i, "-2")
    .replace(/-I$/i, "-1");
}

export function nombreArchivoHorarioPdf(periodoNombre: string, estado: string): string {
  return `horarios-${slugPeriodoParaArchivo(periodoNombre)}-${estado.toLowerCase()}.pdf`;
}
