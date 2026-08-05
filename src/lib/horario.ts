export type SesionConHoras = {
  hora_inicio?: string | null;
  hora_fin?: string | null;
};

const HORA_INICIO_BASE = 7 * 60;
const HORA_FIN_BASE = 18 * 60;

function minutos(hora: string): number {
  const [horaParte, minutoParte] = hora.slice(0, 5).split(":").map(Number);
  return horaParte * 60 + minutoParte;
}

function formatoHora(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Devuelve una escala continua de 30 minutos que siempre incluye los límites del horario. */
export function generarSlots30(sesiones: SesionConHoras[] = []): string[] {
  const inicios = sesiones.flatMap((sesion) => sesion.hora_inicio ? [minutos(sesion.hora_inicio)] : []);
  const fines = sesiones.flatMap((sesion) => sesion.hora_fin ? [minutos(sesion.hora_fin)] : []);
  const inicio = Math.min(HORA_INICIO_BASE, ...inicios.map((hora) => Math.floor(hora / 30) * 30));
  const fin = Math.max(HORA_FIN_BASE, ...fines.map((hora) => Math.ceil(hora / 30) * 30));
  return Array.from({ length: Math.floor((fin - inicio) / 30) + 1 }, (_, indice) => formatoHora(inicio + indice * 30));
}

/** Cantidad de franjas de 30 minutos entre hora_inicio y hora_fin (mínimo 1). */
export function slotsDe30Min(inicio: string, fin: string): number {
  const diff = minutos(fin) - minutos(inicio);
  if (diff <= 0) return 1;
  // ceil evita perder la última franja si hubiera decimales raros en el tiempo
  return Math.max(1, Math.ceil(diff / 30 - 1e-9));
}

/** Offset en píxeles desde el inicio de la grilla hasta una hora. */
export function offsetPxDesdeInicio(hora: string, gridStartMin: number, slotHeightPx: number): number {
  return ((minutos(hora) - gridStartMin) / 30) * slotHeightPx;
}

/** Altura en píxeles de un bloque para la duración inicio→fin. */
export function alturaBloquePx(inicio: string, fin: string, slotHeightPx: number, gapPx = 2): number {
  return slotsDe30Min(inicio, fin) * slotHeightPx - gapPx;
}

/** Genera un índice estable para que un docente conserve su color entre cursos y vistas. */
export function indiceColorEstable(valor: string | null | undefined, cantidad: number): number {
  const texto = valor || "sin-docente";
  let hash = 0;
  for (const caracter of texto) hash = (hash * 31 + caracter.charCodeAt(0)) | 0;
  return Math.abs(hash) % cantidad;
}
