export type BloqueDisponibilidad = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

const DURACION_BLOQUE_MINUTOS = 30;

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
