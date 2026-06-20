import type { Database } from "@/types/database";

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
  modalidad: "presencial" | "virtual";
}

export interface Asignacion {
  id?: string;
  horario_id: string;
  materia_id: string;
  docente_id: string;
  grupo_id: string;
  espacio_id: string | null;
  modalidad: "presencial" | "virtual";
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  sede_id: string;
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

export type ReglaResultado =
  | { valida: true }
  | { valida: false; conflicto: Conflicto };

export interface ReglaFn {
  (candidato: Slot, context: ContextoProgramacion, asignadas: Asignacion[]): ReglaResultado;
}

export interface ContextoProgramacion {
  periodo: Database["public"]["Tables"]["periodos"]["Row"];
  materias: Database["public"]["Tables"]["materias"]["Row"][];
  grupos: Database["public"]["Tables"]["grupos"]["Row"][];
  docentes: DocenteConDisponibilidad[];
  espacios: Database["public"]["Tables"]["espacios"]["Row"][];
  horario_id: string;
  config: ConfiguracionScheduler;
}

export interface DocenteConDisponibilidad {
  id: string;
  tipo_contrato: Database["public"]["Tables"]["docentes"]["Row"]["tipo_contrato"];
  hora_entrada: string | null;
  hora_salida: string | null;
  max_horas_semana: number;
  sede_principal_id: string | null;
  disponibilidad: BloqueDisponibilidad[];
}

export interface BloqueDisponibilidad {
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  es_tiempo_oficina: boolean;
}

export interface ConfiguracionScheduler {
  max_intentos_backtrack: number;
  hora_inicio_jornada: string;
  hora_fin_jornada: string;
  duracion_bloque_minutos: number;
  dias_laborables: DiaSemana[];
}

export const CONFIG_DEFAULT: ConfiguracionScheduler = {
  max_intentos_backtrack: 100,
  hora_inicio_jornada: "07:00",
  hora_fin_jornada: "19:00",
  duracion_bloque_minutos: 60,
  dias_laborables: [1, 2, 3, 4, 5],
};

export interface ResultadoGeneracion {
  exito: boolean;
  horario_id: string;
  total_asignaciones: number;
  conflictos_no_resueltos: Conflicto[];
  log: string[];
}
