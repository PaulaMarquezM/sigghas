import type { Database, ModalidadClase } from "@/types/database";

export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6;

export interface Slot {
  materia_id: string;
  grupo_id: string;
  dia: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  docente_id: string;
  espacio_id: string | null;
  sede_id: string;
  modalidad: ModalidadClase;
}

export interface Asignacion extends Omit<Slot, "dia"> {
  id?: string;
  horario_id: string;
  dia_semana: DiaSemana;
  /** Grupos adicionales que reciben la misma sesión virtual o híbrida. */
  grupos_compartidos?: string[];
}

export interface Conflicto {
  regla: string;
  codigo: string;
  tipo: "error" | "advertencia";
  mensaje: string;
  materia_id?: string;
  docente_id?: string;
  grupo_id?: string;
  espacio_id?: string;
  dia?: DiaSemana;
  hora_inicio?: string;
  hora_fin?: string;
}

export type ReglaResultado = { valida: true } | { valida: false; conflicto: Conflicto };

export interface DocenteConDisponibilidad {
  id: string;
  /** Nombre del perfil asociado; opcional en fixtures de prueba. */
  nombre?: string;
  tipo_contrato: Database["public"]["Tables"]["docentes"]["Row"]["tipo_contrato"];
  hora_entrada: string | null;
  hora_salida: string | null;
  max_horas_semana: number;
  sede_principal_id: string | null;
  sede_ids?: string[];
  disponibilidad: BloqueDisponibilidad[];
}

export interface BloqueDisponibilidad {
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  es_tiempo_oficina: boolean;
}

export interface BloqueDisponibilidadEspacio {
  espacio_id: string;
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

export interface AsignacionDocentePeriodo {
  periodo_id: string;
  materia_id: string;
  grupo_id: string;
  docente_id: string;
}

export interface ContextoProgramacion {
  periodo: Database["public"]["Tables"]["periodos"]["Row"];
  materias: Database["public"]["Tables"]["materias"]["Row"][];
  grupos: Database["public"]["Tables"]["grupos"]["Row"][];
  docentes: DocenteConDisponibilidad[];
  espacios: Database["public"]["Tables"]["espacios"]["Row"][];
  asignaciones_docente?: AsignacionDocentePeriodo[];
  disponibilidad_espacio?: BloqueDisponibilidadEspacio[];
  horario_id: string;
  config: ConfiguracionScheduler;
}

export interface ConfiguracionScheduler {
  max_intentos_backtrack: number;
  hora_inicio_jornada: string;
  hora_fin_jornada: string;
  duracion_bloque_minutos: number;
  dias_laborables: DiaSemana[];
  hora_inicio_receso?: string;
  hora_fin_receso?: string;
  max_horas_diarias?: number;
  separacion_presencial_minutos?: number;
}

export const CONFIG_DEFAULT: ConfiguracionScheduler = {
  max_intentos_backtrack: 250_000,
  hora_inicio_jornada: "08:00",
  hora_fin_jornada: "17:00",
  duracion_bloque_minutos: 30,
  dias_laborables: [1, 2, 3, 4, 5],
  hora_inicio_receso: "12:00",
  hora_fin_receso: "14:00",
  max_horas_diarias: 6,
  separacion_presencial_minutos: 120,
};

export interface ResultadoGeneracion {
  exito: boolean;
  horario_id: string;
  total_asignaciones: number;
  sesiones_esperadas: number;
  sesiones_generadas: number;
  conflictos_no_resueltos: Conflicto[];
  log: string[];
}
