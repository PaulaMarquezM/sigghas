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
  /** Nombres de sede para mensajes de conflicto; opcional en fixtures. */
  sedes?: { id: string; nombre: string }[];
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
  /** Tope opcional de horas de clase por día (docente y grupo). Sin definir = sin límite diario. */
  max_horas_diarias?: number;
}

export const CONFIG_DEFAULT: ConfiguracionScheduler = {
  max_intentos_backtrack: 250_000,
  hora_inicio_jornada: "08:00",
  hora_fin_jornada: "17:00",
  duracion_bloque_minutos: 30,
  dias_laborables: [1, 2, 3, 4, 5],
  hora_inicio_receso: "12:00",
  hora_fin_receso: "14:00",
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

/** Fases reales del generador (para UI de progreso en vivo). */
export type PasoGeneracion =
  | "verificando"
  | "cargando"
  | "validando"
  | "resolviendo"
  | "guardando"
  | "completado"
  | "error";

export interface ProgresoGeneracion {
  paso: PasoGeneracion;
  titulo: string;
  detalle?: string;
  /** Sesión / ítem actual (p. ej. 12). */
  actual?: number;
  /** Total esperado (p. ej. 48). */
  total?: number;
}

export type EventoGeneracion =
  | { tipo: "progreso"; progreso: ProgresoGeneracion }
  | { tipo: "resultado"; resultado: ResultadoGeneracion }
  | { tipo: "error"; mensaje: string }
  | { tipo: "cancelado" };

export type OnProgresoGeneracion = (progreso: ProgresoGeneracion) => void;

export class GeneracionCanceladaError extends Error {
  constructor(message = "Generación cancelada por el usuario.") {
    super(message);
    this.name = "GeneracionCanceladaError";
  }
}

export function assertGeneracionNoCancelada(signal?: AbortSignal) {
  if (signal?.aborted) throw new GeneracionCanceladaError();
}
