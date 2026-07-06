import { describe, it, expect } from "vitest";
import { resolverConBacktrack } from "@/lib/scheduler/backtrack";
import { initializeRules } from "@/lib/scheduler/rules/index";
import type { ContextoProgramacion } from "@/lib/scheduler/types";

// Base config
const mockConfig = {
  max_intentos_backtrack: 100,
  hora_inicio_jornada: "07:00",
  hora_fin_jornada: "12:00", // Short day to force backtrack if tight
  duracion_bloque_minutos: 60,
  dias_laborables: [1, 2] as any[], // Mon-Tue
};

const mockContexto: ContextoProgramacion = {
  periodo: { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-03-01", fecha_fin: "2026-07-31", activo: true, creado_en: "" },
  materias: [
    { id: "m-1", codigo: "SW-01", nombre: "Materia 1", semestre: 5, horas_semana: 2, requiere_laboratorio: false, creado_en: "", nivel: 5, horas_teoria: 1, horas_practica: 1, modalidad: "presencial", activo: true }
  ],
  grupos: [
    { id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" }
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
    { id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, creado_en: "", tiene_proyector: true, tiene_internet: true, activo: true }
  ],
  horario_id: "h-1",
  config: mockConfig,
};

describe("Scheduler Algorithm Integration Tests", () => {
  it("should generate a valid schedule using greedy with backtracking", () => {
    // 1. Initialize rules
    initializeRules({ materias: mockContexto.materias });

    const log: string[] = [];
    const result = resolverConBacktrack(mockContexto, log, 100);

    // Verify it resolved successfully
    expect(result.exito).toBe(true);
    expect(result.asignaciones.length).toBeGreaterThan(0);
    expect(result.conflictos.length).toBe(0);

    // Verify the assignment details match the context
    const asig = result.asignaciones[0];
    expect(asig.horario_id).toBe("h-1");
    expect(asig.materia_id).toBe("m-1");
    expect(asig.grupo_id).toBe("g-1");
    expect(asig.docente_id).toBe("d-1");
    expect(asig.espacio_id).toBe("e-1");
  });
});
