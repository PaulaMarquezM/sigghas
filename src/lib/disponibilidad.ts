export type BloqueDisponibilidad = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

const DURACION_BLOQUE_MINUTOS = 30;
const DIAS_GRILLA = [1, 2, 3, 4, 5, 6] as const;
const HORA_INICIO_GRILLA = "08:00";
const HORA_FIN_GRILLA = "17:00";

/** Franja completa de la grilla docente: lunes a sábado, 08:00–17:00. */
export function bloquesDisponibilidadTotal(): BloqueDisponibilidad[] {
  return DIAS_GRILLA.map((dia_semana) => ({
    dia_semana,
    hora_inicio: HORA_INICIO_GRILLA,
    hora_fin: HORA_FIN_GRILLA,
  }));
}

function minutosDesdeHora(hora: string) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function horaDesdeMinutos(minutos: number) {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/**
 * La grilla envía un valor por cada celda de 30 minutos. El planificador,
 * en cambio, valida que una sesión esté cubierta por una franja continua.
 * Esta función une las celdas contiguas antes de guardarlas.
 */
export function consolidarBloquesDisponibilidad(valores: readonly string[]): BloqueDisponibilidad[] {
  const celdas = [...new Set(valores)]
    .map((valor) => {
      const [diaTexto, hora] = valor.split("-");
      const dia = Number(diaTexto);
      const inicio = minutosDesdeHora(hora);
      return { dia, inicio };
    })
    .filter(({ dia, inicio }) => Number.isInteger(dia) && dia >= 1 && dia <= 6 && Number.isInteger(inicio) && inicio >= 0 && inicio < 24 * 60 && inicio % DURACION_BLOQUE_MINUTOS === 0)
    .sort((a, b) => a.dia - b.dia || a.inicio - b.inicio);

  const bloques: BloqueDisponibilidad[] = [];
  for (const celda of celdas) {
    const ultimo = bloques.at(-1);
    const horaInicio = horaDesdeMinutos(celda.inicio);
    if (ultimo && ultimo.dia_semana === celda.dia && minutosDesdeHora(ultimo.hora_fin) === celda.inicio) {
      ultimo.hora_fin = horaDesdeMinutos(celda.inicio + DURACION_BLOQUE_MINUTOS);
      continue;
    }
    bloques.push({
      dia_semana: celda.dia,
      hora_inicio: horaInicio,
      hora_fin: horaDesdeMinutos(celda.inicio + DURACION_BLOQUE_MINUTOS),
    });
  }

  return bloques;
}

/** Convierte las franjas guardadas en las celdas de 30 minutos de la grilla. */
export function expandirBloquesDisponibilidad(bloques: readonly BloqueDisponibilidad[]): Set<string> {
  const seleccionados = new Set<string>();

  for (const bloque of bloques) {
    const inicio = minutosDesdeHora(bloque.hora_inicio);
    const fin = minutosDesdeHora(bloque.hora_fin);
    if (!Number.isInteger(bloque.dia_semana) || bloque.dia_semana < 1 || bloque.dia_semana > 6 || !Number.isInteger(inicio) || !Number.isInteger(fin) || inicio < 0 || fin > 24 * 60 || inicio >= fin) continue;

    for (let minuto = inicio; minuto < fin; minuto += DURACION_BLOQUE_MINUTOS) {
      seleccionados.add(`${bloque.dia_semana}-${horaDesdeMinutos(minuto)}`);
    }
  }

  return seleccionados;
}
