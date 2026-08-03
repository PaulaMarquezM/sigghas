import { describe, expect, it } from "vitest";
import { generarSlots, validarCandidato } from "@/lib/scheduler/greedy";
import { CONFIG_DEFAULT, type Asignacion, type ContextoProgramacion } from "@/lib/scheduler/types";
import type { AsignacionPendiente } from "@/lib/scheduler/greedy";

function baseContexto(overrides: Partial<ContextoProgramacion> = {}): ContextoProgramacion {
  return {
    periodo: { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-03-01", fecha_fin: "2026-07-31", activo: true, creado_en: "" },
    materias: [{ id: "m-1", codigo: "SW-01", nombre: "Materia", semestre: 5, horas_semana: 2, horas_teoria: 2, horas_practica: 0, requiere_laboratorio: false, modalidad: "presencial", activo: true, nivel: 5, creado_en: "" }],
    grupos: [{ id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" }],
    docentes: [{ id: "d-1", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad: [1, 2, 3, 4, 5].map((dia_semana) => ({ dia_semana: dia_semana as 1 | 2 | 3 | 4 | 5, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false })) }],
    espacios: [{ id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" }],
    horario_id: "h-1",
    config: CONFIG_DEFAULT,
    ...overrides,
  };
}

const pendiente: AsignacionPendiente = {
  materia_id: "m-1",
  grupo_id: "g-1",
  docente_id: "d-1",
  duracion_horas: 2,
  indice_sesion: 0,
  total_sesiones: 1,
};

describe("generarSlots — filtros de espacio (RN14, RN16, RN39, RN41)", () => {
  it("RN41: no ofrece un espacio deshabilitado (disponible=false)", () => {
    const ctx = baseContexto({ espacios: [{ id: "e-1", nombre: "Aula en mantenimiento", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-1", disponible: false, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" }] });
    const slots = generarSlots(pendiente, ctx);
    expect(slots).toHaveLength(0);
  });


  it("RN14: no ofrece un aula con capacidad menor a la del grupo", () => {
    const ctx = baseContexto({ espacios: [{ id: "e-1", nombre: "Aula pequeña", tipo: "aula", capacidad: 10, accesible: true, sede_id: "s-1", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" }] });
    const slots = generarSlots(pendiente, ctx);
    expect(slots).toHaveLength(0);
  });

  it("RN16: una materia que requiere laboratorio solo usa espacios tipo laboratorio", () => {
    const ctx = baseContexto({
      materias: [{ id: "m-1", codigo: "SW-01", nombre: "Materia", semestre: 5, horas_semana: 2, horas_teoria: 0, horas_practica: 2, requiere_laboratorio: true, modalidad: "presencial", activo: true, nivel: 5, creado_en: "" }],
      espacios: [
        { id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" },
        { id: "e-2", nombre: "Lab 1", tipo: "laboratorio", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" },
      ],
    });
    const slots = generarSlots(pendiente, ctx);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.espacio_id === "e-2")).toBe(true);
  });

  it("RN39: un grupo solo recibe clases presenciales en espacios de su propia sede", () => {
    const ctx = baseContexto({ espacios: [{ id: "e-1", nombre: "Aula otra sede", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-2", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" }] });
    const slots = generarSlots(pendiente, ctx);
    expect(slots).toHaveLength(0);
  });
});

describe("validarCandidato — sesión compartida entre grupos (RN21)", () => {
  it("dos grupos pueden compartir la misma sesión virtual sin choque de DOCENTE_OCUPADO", () => {
    const ctx = baseContexto();
    const sesionVirtualExistente: Asignacion = {
      horario_id: "h-1", materia_id: "m-1", grupo_id: "g-2", docente_id: "d-1",
      dia_semana: 1, hora_inicio: "09:00", hora_fin: "10:00", espacio_id: null, sede_id: "s-1", modalidad: "virtual",
    };
    const candidatoCompartido = {
      materia_id: "m-1", grupo_id: "g-3", docente_id: "d-1", dia: 1 as const,
      hora_inicio: "09:00", hora_fin: "10:00", espacio_id: null, sede_id: "s-1", modalidad: "virtual" as const,
    };
    const ctxVirtual = baseContexto({
      materias: [{ ...ctx.materias[0], modalidad: "virtual" }],
      grupos: [
        { id: "g-2", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" },
        { id: "g-3", nombre: "SW-5B", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" },
      ],
    });
    const resultado = validarCandidato(candidatoCompartido, ctxVirtual, [sesionVirtualExistente]);
    expect(resultado.valida).toBe(true);
  });
});
