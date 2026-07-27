import { describe, it, expect, vi, beforeEach } from "vitest";
import { validarMovimientoAction, guardarMovimientoAction } from "@/app/dashboard/editar/[horarioId]/actions";
import type { ContextoProgramacion, Asignacion } from "@/lib/scheduler/types";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth helpers
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: "user-uuid" } }),
  requireRol: vi.fn().mockResolvedValue({ id: "user-uuid", rol: "coordinador" }),
}));

const { mockSingle, mockHorarioSingle, mockUpdate, mockInsert, mockSelect } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockHorarioSingle = vi.fn().mockResolvedValue({ data: { estado: "borrador" }, error: null });
  const mockUpdate = vi.fn().mockImplementation(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockSelect = vi.fn().mockImplementation(() => ({ eq: vi.fn().mockImplementation(() => ({ single: mockSingle })) }));
  return { mockSingle, mockHorarioSingle, mockUpdate, mockInsert, mockSelect };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockImplementation((table) => {
      if (table === "sesiones") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      if (table === "historial_cambios") {
        return {
          insert: mockInsert,
        };
      }
      if (table === "horarios") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockHorarioSingle }) }) };
      }
      return {};
    }),
  }),
}));

const mockContexto: ContextoProgramacion = {
  periodo: { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-03-01", fecha_fin: "2026-07-31", activo: true, creado_en: "" },
  materias: [
    { id: "m-1", codigo: "SW-01", nombre: "Programación", semestre: 5, horas_semana: 4, requiere_laboratorio: false, creado_en: "", nivel: 5, horas_teoria: 2, horas_practica: 2, modalidad: "presencial", activo: true }
  ],
  grupos: [
    { id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 30, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" }
  ],
  docentes: [
    {
      id: "d-1",
      tipo_contrato: "por_horas",
      hora_entrada: null,
      hora_salida: null,
      max_horas_semana: 20,
      sede_principal_id: "s-1",
      disponibilidad: [
        { dia_semana: 1, hora_inicio: "07:00", hora_fin: "12:00", es_tiempo_oficina: false }
      ]
    }
  ],
  espacios: [
    { id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 40, accesible: true, sede_id: "s-1", disponible: true, creado_en: "", tiene_proyector: true, tiene_internet: true, activo: true }
  ],
  horario_id: "h-1",
  config: {
    max_intentos_backtrack: 100,
    hora_inicio_jornada: "07:00",
    hora_fin_jornada: "19:00",
    duracion_bloque_minutos: 60,
    dias_laborables: [1, 2, 3, 4, 5],
  }
};

const mockAsignaciones: Asignacion[] = [
  {
    id: "sesion-1",
    horario_id: "h-1",
    materia_id: "m-1",
    docente_id: "d-1",
    grupo_id: "g-1",
    espacio_id: "e-1",
    modalidad: "presencial",
    dia_semana: 1,
    hora_inicio: "07:00",
    hora_fin: "09:00",
    sede_id: "s-1",
  }
];

describe("Pruebas de integración de edición manual de horarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valida correctamente un movimiento válido", async () => {
    // Move "sesion-1" to Monday 09:00-11:00 (which is within teacher availability and classroom is free)
    const result = await validarMovimientoAction(mockContexto, mockAsignaciones, "sesion-1", {
      dia_semana: 1,
      hora_inicio: "09:00",
      hora_fin: "11:00",
      espacio_id: "e-1",
    });

    expect(result.valida).toBe(true);
  });

  it("detecta un conflicto al mover a una franja fuera de la disponibilidad del docente", async () => {
    // Move to Monday 14:00 (outside teacher's 07:00-12:00 availability)
    const result = await validarMovimientoAction(mockContexto, mockAsignaciones, "sesion-1", {
      dia_semana: 1,
      hora_inicio: "14:00",
      hora_fin: "16:00",
      espacio_id: "e-1",
    });

    expect(result.valida).toBe(false);
    expect(result.conflicto?.codigo).toBe("DOCENTE_NO_DISPONIBLE");
  });

  it("guarda un movimiento válido y registra el historial", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "sesion-1",
        dia_semana: 1,
        hora_inicio: "07:00",
        hora_fin: "09:00",
        espacio_id: "e-1",
      },
      error: null,
    });

    const res = await guardarMovimientoAction(
      "sesion-1",
      { dia_semana: 1, hora_inicio: "09:00", hora_fin: "11:00", espacio_id: "e-1" },
      "h-1"
    );

    expect(res.exito).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "edicion",
        horario_id: "h-1",
      })
    );
  });
});
