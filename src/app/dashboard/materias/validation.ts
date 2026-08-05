import { formBoolean, formNumber, formString } from "@/lib/entities";
import type { ModalidadClase } from "@/types/database";

/** Normaliza acentos, mayúsculas y signos para comparar nombres de materias. */
export function normalizarNombreMateria(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distanciaLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + costo);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

/** Detecta duplicados aunque haya faltas ortográficas o diferencias de acentos. */
export function sonNombresSimilares(a: string, b: string): boolean {
  const na = normalizarNombreMateria(a);
  const nb = normalizarNombreMateria(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const corto = na.length <= nb.length ? na : nb;
  const largo = na.length <= nb.length ? nb : na;
  if (corto.length >= 5 && largo.includes(corto)) return true;

  const maxLen = Math.max(na.length, nb.length);
  const umbral = Math.max(2, Math.floor(maxLen * 0.22));
  return distanciaLevenshtein(na, nb) <= umbral;
}

export function encontrarMateriaDuplicada(
  nombre: string,
  existentes: Array<{ id: string; nombre: string }>,
  excluirId?: string
): { id: string; nombre: string } | null {
  for (const materia of existentes) {
    if (excluirId && materia.id === excluirId) continue;
    if (sonNombresSimilares(nombre, materia.nombre)) return materia;
  }
  return null;
}

export function payload(formData: FormData) {
  const codigoIngresado = formString(formData, "codigo").toUpperCase();
  const codigo = codigoIngresado || `MAT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const nombre = formString(formData, "nombre");
  if (!nombre) throw new Error("Escribe el nombre de la materia para continuar.");
  const nivel = formNumber(formData, "nivel", 1);
  const horas_teoria = formNumber(formData, "horas_teoria", 0);
  const horas_practica = formNumber(formData, "horas_practica", 0);
  const horas_semana = horas_teoria + horas_practica;
  if (horas_semana <= 0 || horas_semana > 6 || !Number.isInteger(horas_semana * 2)) {
    throw new Error("Revisa las horas de teoría y práctica: juntas deben sumar entre 0,5 y 6 horas, usando intervalos de 30 minutos.");
  }
  const modalidad = formString(formData, "modalidad") as ModalidadClase;
  return {
    codigo,
    nombre,
    semestre: nivel,
    nivel,
    horas_semana,
    horas_teoria,
    horas_practica,
    modalidad,
    requiere_laboratorio: false,
    activo: formBoolean(formData, "activo"),
  };
}
