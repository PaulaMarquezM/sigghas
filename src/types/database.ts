export type RolUsuario = "coordinador" | "docente" | "estudiante" | "administrador" | "apoyo";
export type TipoContrato = "tiempo_completo" | "por_horas" | "titular" | "contratado" | "honorarios";
export type ModalidadClase = "presencial" | "hibrida" | "virtual";
export type TipoEspacio = "aula" | "laboratorio" | "sala_reuniones" | "auditorio";
export type EstadoHorario = "borrador" | "aprobado" | "publicado";

export interface Database {
  public: {
    Tables: {
      sedes: {
        Row: { id: string; nombre: string; es_central: boolean; creado_en: string };
        Insert: Omit<Database["public"]["Tables"]["sedes"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["sedes"]["Insert"]>;
        Relationships: [];
      };
      perfiles: {
        Row: {
          id: string; nombre: string; email: string; rol: RolUsuario;
          sede_id: string | null; activo: boolean; debe_cambiar_password: boolean;
          creado_en: string; actualizado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["perfiles"]["Row"], "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["perfiles"]["Insert"]>;
        Relationships: [];
      };
      docentes: {
        Row: {
          id: string; tipo_contrato: TipoContrato; hora_entrada: string | null;
          hora_salida: string | null; max_horas_semana: number; sede_principal_id: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["docentes"]["Row"], never>;
        Update: Partial<Database["public"]["Tables"]["docentes"]["Insert"]>;
        Relationships: [];
      };
      estudiantes: {
        Row: { id: string; creado_en: string };
        Insert: Omit<Database["public"]["Tables"]["estudiantes"]["Row"], "creado_en">;
        Update: never;
        Relationships: [];
      };
      docente_sedes: {
        Row: { docente_id: string; sede_id: string; creado_en: string };
        Insert: Omit<Database["public"]["Tables"]["docente_sedes"]["Row"], "creado_en">;
        Update: never;
        Relationships: [];
      };
      matriculas_estudiante: {
        Row: { id: string; estudiante_id: string; periodo_id: string; materia_id: string; grupo_id: string; motivo: "regular" | "arrastre" | "repeticion" | "convalidacion"; creado_en: string };
        Insert: Omit<Database["public"]["Tables"]["matriculas_estudiante"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["matriculas_estudiante"]["Insert"]>;
        Relationships: [];
      };
      disponibilidad_docente: {
        Row: {
          id: string; docente_id: string; dia_semana: number;
          hora_inicio: string; hora_fin: string; es_tiempo_oficina: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["disponibilidad_docente"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["disponibilidad_docente"]["Insert"]>;
        Relationships: [];
      };
      materias: {
        Row: {
          id: string; codigo: string; nombre: string; semestre: number;
          horas_semana: number; requiere_laboratorio: boolean; creado_en: string;
          nivel: number; horas_teoria: number; horas_practica: number;
          modalidad: ModalidadClase; activo: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["materias"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["materias"]["Insert"]>;
        Relationships: [];
      };
      asignaciones_docente_periodo: {
        Row: { periodo_id: string; materia_id: string; grupo_id: string; docente_id: string; creado_en: string };
        Insert: Omit<Database["public"]["Tables"]["asignaciones_docente_periodo"]["Row"], "creado_en">;
        Update: Partial<Database["public"]["Tables"]["asignaciones_docente_periodo"]["Insert"]>;
        Relationships: [];
      };
      disponibilidad_espacio: {
        Row: { id: string; espacio_id: string; dia_semana: number; hora_inicio: string; hora_fin: string; disponible: boolean };
        Insert: Omit<Database["public"]["Tables"]["disponibilidad_espacio"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["disponibilidad_espacio"]["Insert"]>;
        Relationships: [];
      };
      grupos: {
        Row: {
          id: string; nombre: string; semestre: number; cantidad_estudiantes: number;
          sede_id: string; requiere_accesibilidad: boolean; activo: boolean; creado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["grupos"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["grupos"]["Insert"]>;
        Relationships: [];
      };
      espacios: {
        Row: {
          id: string; nombre: string; tipo: TipoEspacio; capacidad: number;
          accesible: boolean; sede_id: string; disponible: boolean; creado_en: string;
          tiene_proyector: boolean; tiene_internet: boolean; activo: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["espacios"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["espacios"]["Insert"]>;
        Relationships: [];
      };
      periodos: {
        Row: {
          id: string; nombre: string; fecha_inicio: string;
          fecha_fin: string; activo: boolean; creado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["periodos"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["periodos"]["Insert"]>;
        Relationships: [];
      };
      horarios: {
        Row: {
          id: string; periodo_id: string; estado: EstadoHorario;
          generado_en: string | null; aprobado_en: string | null;
          aprobado_por: string | null; creado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["horarios"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["horarios"]["Insert"]>;
        Relationships: [];
      };
      sesiones: {
        Row: {
          id: string; horario_id: string; materia_id: string; docente_id: string;
          grupo_id: string; espacio_id: string | null; modalidad: ModalidadClase;
          dia_semana: number; hora_inicio: string; hora_fin: string;
          sede_id: string; creado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sesiones"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["sesiones"]["Insert"]>;
        Relationships: [];
      };
      sesiones_grupos_compartidos: {
        Row: { sesion_id: string; grupo_id: string };
        Insert: Database["public"]["Tables"]["sesiones_grupos_compartidos"]["Row"];
        Update: Partial<Database["public"]["Tables"]["sesiones_grupos_compartidos"]["Row"]>;
        Relationships: [];
      };
      historial_cambios: {
        Row: {
          id: string; sesion_id: string | null; horario_id: string | null;
          usuario_id: string; accion: string; detalle: Record<string, unknown> | null; creado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["historial_cambios"]["Row"], "id" | "creado_en">;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      auth_rol: { Args: Record<never, never>; Returns: RolUsuario };
      guardar_horario_generado: { Args: { p_periodo_id: string; p_sesiones: Record<string, unknown>[]; p_reemplazar_borrador_id?: string | null }; Returns: string };
    };
    Enums: {
      rol_usuario: RolUsuario;
      tipo_contrato: TipoContrato;
      modalidad_clase: ModalidadClase;
      tipo_espacio: TipoEspacio;
      estado_horario: EstadoHorario;
    };
    CompositeTypes: Record<string, never>;
  };
}
