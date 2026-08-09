import { describe, expect, it } from "vitest";
import { validarCandidato } from "@/lib/scheduler/greedy";
import { resolverConBacktrack } from "@/lib/scheduler/backtrack";
import { CONFIG_DEFAULT, type Asignacion, type ContextoProgramacion, type Slot } from "@/lib/scheduler/types";

function baseContexto(overrides: Partial<ContextoProgramacion> = {}): ContextoProgramacion {
  return {
    periodo: { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-03-01", fecha_fin: "2026-07-31", activo: true, creado_en: "" },
    materias: [{ id: "m-1", codigo: "SW-01", nombre: "Materia", semestre: 5, horas_semana: 3, horas_teoria: 3, horas_practica: 0, requiere_laboratorio: false, modalidad: "presencial", activo: true, nivel: 5, creado_en: "" }],
    grupos: [{ id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" }],
    docentes: [{ id: "d-1", nombre: "Ana Pérez", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad: [1, 2, 3, 4, 5].map((dia_semana) => ({ dia_semana: dia_semana as 1 | 2 | 3 | 4 | 5, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false })) }],
    espacios: [{ id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" }],
    sedes: [{ id: "s-1", nombre: "Norte" }, { id: "s-2", nombre: "Sur" }],
    asignaciones_docente: [{ periodo_id: "p-1", materia_id: "m-1", grupo_id: "g-1", docente_id: "d-1" }],
    horario_id: "h-1",
    config: CONFIG_DEFAULT,
    ...overrides,
  };
}

function slot(overrides: Partial<Slot> = {}): Slot {
  return {
    materia_id: "m-1",
    grupo_id: "g-1",
    docente_id: "d-1",
    dia: 1,
    hora_inicio: "09:00",
    hora_fin: "10:00",
    espacio_id: "e-1",
    sede_id: "s-1",
    modalidad: "presencial",
    ...overrides,
  };
}

function asignacion(overrides: Partial<Asignacion> = {}): Asignacion {
  return {
    horario_id: "h-1",
    materia_id: "m-1",
    grupo_id: "g-1",
    docente_id: "d-1",
    dia_semana: 1,
    hora_inicio: "09:00",
    hora_fin: "10:00",
    espacio_id: "e-1",
    sede_id: "s-1",
    modalidad: "presencial",
    ...overrides,
  };
}

describe("validarCandidato — cada regla de negocio produce el código de conflicto esperado", () => {
  it("CONFIGURACION_INCOMPLETA cuando el docente/grupo/materia no existe en el contexto", () => {
    const ctx = baseContexto();
    const resultado = validarCandidato(slot({ docente_id: "no-existe" }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "CONFIGURACION_INCOMPLETA" }) });
  });

  it("DOCENTE_SEDE_NO_HABILITADA cuando la sede no fue asignada al docente", () => {
    const ctx = baseContexto({
      docentes: [{ id: "d-1", nombre: "Ana Pérez", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1", sede_ids: ["s-1"], disponibilidad: [{ dia_semana: 1, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false }] }],
    });
    const resultado = validarCandidato(slot({ sede_id: "s-2" }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "DOCENTE_SEDE_NO_HABILITADA", mensaje: expect.stringContaining("Ana Pérez") }) });
  });

  it("FRANJA_INVALIDA cuando el horario no cae en bloques de 30 minutos", () => {
    const ctx = baseContexto();
    const resultado = validarCandidato(slot({ hora_inicio: "09:10", hora_fin: "10:10" }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "FRANJA_INVALIDA" }) });
  });

  it("FRANJA_INVALIDA cuando la sesión dura más de 3h30", () => {
    const ctx = baseContexto();
    const resultado = validarCandidato(slot({ hora_inicio: "08:00", hora_fin: "12:00" }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "FRANJA_INVALIDA" }) });
  });

  it("SABADO_NO_PERMITIDO para un grupo que no es de 7.º/8.º semestre", () => {
    const ctx = baseContexto();
    const resultado = validarCandidato(slot({ dia: 6 }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "SABADO_NO_PERMITIDO" }) });
  });

  it("permite sábado para un grupo de 7.º semestre", () => {
    const ctx = baseContexto({
      grupos: [{ id: "g-1", nombre: "SW-7A", semestre: 7, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" }],
      docentes: [{ id: "d-1", nombre: "Ana Pérez", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad: [1, 2, 3, 4, 5, 6].map((dia_semana) => ({ dia_semana: dia_semana as 1 | 2 | 3 | 4 | 5 | 6, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false })) }],
    });
    const resultado = validarCandidato(slot({ dia: 6 }), ctx, []);
    expect(resultado.valida).toBe(true);
  });

  it("DOCENTE_NO_DISPONIBLE cuando el docente no tiene disponibilidad ese día", () => {
    const ctx = baseContexto({ docentes: [{ id: "d-1", nombre: "Ana Pérez", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad: [{ dia_semana: 1, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false }] }] });
    const resultado = validarCandidato(slot({ dia: 2 }), ctx, []);
    expect(resultado).toEqual({
      valida: false,
      conflicto: expect.objectContaining({
        codigo: "DOCENTE_NO_DISPONIBLE",
        mensaje: "Ana Pérez no está disponible para SW-01 Materia · SW-5A (martes 09:00–10:00): no hay un bloque de disponibilidad que cubra toda la sesión.",
      }),
    });
  });

  it("DOCENTE_NO_DISPONIBLE cuando la franja cae en tiempo de oficina", () => {
    const ctx = baseContexto({
      docentes: [{
        id: "d-1", nombre: "Ana Pérez", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1",
        disponibilidad: [
          { dia_semana: 1, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false },
          { dia_semana: 1, hora_inicio: "09:00", hora_fin: "10:00", es_tiempo_oficina: true },
        ],
      }],
    });
    const resultado = validarCandidato(slot(), ctx, []);
    expect(resultado).toEqual({
      valida: false,
      conflicto: expect.objectContaining({
        codigo: "DOCENTE_NO_DISPONIBLE",
        mensaje: "Ana Pérez tiene tiempo de oficina que se solapa con SW-01 Materia · SW-5A (lunes 09:00–10:00). Revisa su disponibilidad.",
      }),
    });
  });

  it("EXCEDE_MAX_HORAS cuando la sesión supera la carga semanal del docente", () => {
    const ctx = baseContexto({ docentes: [{ id: "d-1", nombre: "Ana Pérez", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 0.5, sede_principal_id: "s-1", disponibilidad: [1, 2, 3, 4, 5].map((dia_semana) => ({ dia_semana: dia_semana as 1 | 2 | 3 | 4 | 5, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false })) }] });
    const resultado = validarCandidato(slot(), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "EXCEDE_MAX_HORAS", mensaje: expect.stringContaining("Ana Pérez") }) });
  });

  it("EXCEDE_MAX_HORAS_DIARIAS cuando la sesión supera el máximo diario del docente", () => {
    const ctx = baseContexto({ config: { ...CONFIG_DEFAULT, max_horas_diarias: 0.5 } });
    const resultado = validarCandidato(slot(), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "EXCEDE_MAX_HORAS_DIARIAS" }) });
  });

  it("GRUPO_EXCEDE_MAX_HORAS_DIARIAS cuando el grupo (con otro docente) supera el máximo diario", () => {
    const ctx = baseContexto({ config: { ...CONFIG_DEFAULT, max_horas_diarias: 1 } });
    const existente = asignacion({ docente_id: "d-2", hora_inicio: "07:00", hora_fin: "07:30" });
    const resultado = validarCandidato(slot(), ctx, [existente]);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "GRUPO_EXCEDE_MAX_HORAS_DIARIAS" }) });
  });

  it("GRUPO_OCUPADO cuando el grupo ya tiene una sesión que se solapa", () => {
    const ctx = baseContexto();
    const existente = asignacion({ docente_id: "d-2", espacio_id: "e-2" });
    const resultado = validarCandidato(slot(), ctx, [existente]);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "GRUPO_OCUPADO" }) });
  });

  it("DOCENTE_OCUPADO cuando el docente ya tiene otra sesión que se solapa", () => {
    const ctx = baseContexto();
    const existente = asignacion({ grupo_id: "g-2", espacio_id: "e-2" });
    const resultado = validarCandidato(slot(), ctx, [existente]);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "DOCENTE_OCUPADO" }) });
  });

  it("ESPACIO_OCUPADO cuando el aula ya está reservada en esa franja", () => {
    const ctx = baseContexto();
    const existente = asignacion({ grupo_id: "g-2", docente_id: "d-2" });
    const resultado = validarCandidato(slot(), ctx, [existente]);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "ESPACIO_OCUPADO" }) });
  });

  it("DOCENTE_DOS_SEDES cuando el docente ya dicta presencial en otra sede ese día", () => {
    const ctx = baseContexto();
    const existente = asignacion({ grupo_id: "g-2", espacio_id: "e-2", sede_id: "s-2", hora_inicio: "07:00", hora_fin: "07:30" });
    const resultado = validarCandidato(slot({ hora_inicio: "11:00", hora_fin: "12:00" }), ctx, [existente]);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "DOCENTE_DOS_SEDES" }) });
  });

  it("ESPACIO_REQUERIDO cuando una sesión presencial no trae espacio asignado", () => {
    const ctx = baseContexto();
    const resultado = validarCandidato(slot({ espacio_id: null }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "ESPACIO_REQUERIDO" }) });
  });

  it("ESPACIO_NO_PERMITIDO cuando una sesión virtual trae un espacio asignado", () => {
    const ctx = baseContexto({ materias: [{ id: "m-1", codigo: "SW-01", nombre: "Materia", semestre: 5, horas_semana: 3, horas_teoria: 3, horas_practica: 0, requiere_laboratorio: false, modalidad: "virtual", activo: true, nivel: 5, creado_en: "" }] });
    const resultado = validarCandidato(slot({ modalidad: "virtual" }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "ESPACIO_NO_PERMITIDO" }) });
  });

  it("MODALIDAD_INVALIDA cuando la modalidad del candidato no coincide con la de la materia", () => {
    const ctx = baseContexto();
    const resultado = validarCandidato(slot({ modalidad: "hibrida", espacio_id: null }), ctx, []);
    expect(resultado).toEqual({ valida: false, conflicto: expect.objectContaining({ codigo: "MODALIDAD_INVALIDA" }) });
  });
});

describe("resolverConBacktrack — ramas adicionales del backtracking", () => {
  it("no encuentra solución cuando el único día con aula libre ya se usó para la primera sesión", () => {
    // El docente está disponible toda la semana, pero el aula solo está
    // libre el lunes: generarSlots entonces solo produce candidatos para el
    // lunes, así que la 2.ª sesión (que debe ir en un día distinto) siempre
    // choca con la regla de "mismo día" (RN de backtrack.ts) y el
    // backtracking termina descartando también la 1.ª sesión al no hallar
    // ninguna combinación completa; el conflicto final que se reporta es el
    // fallback genérico del nivel más externo (SIN_SLOTS_DISPONIBLES), pero
    // la regla SESIONES_MISMO_DIA sí se evalúa en el camino.
    const ctx = baseContexto({
      materias: [{ id: "m-1", codigo: "SW-01", nombre: "Materia de 5h", semestre: 5, horas_semana: 5, horas_teoria: 5, horas_practica: 0, requiere_laboratorio: false, modalidad: "presencial", activo: true, nivel: 5, creado_en: "" }],
      disponibilidad_espacio: [2, 3, 4, 5].map((dia_semana) => ({ espacio_id: "e-1", dia_semana: dia_semana as 2 | 3 | 4 | 5, hora_inicio: "00:00", hora_fin: "23:59", disponible: false })),
    });
    const resultado = resolverConBacktrack(ctx, [], 10_000);
    expect(resultado.exito).toBe(false);
    expect(resultado.asignaciones).toHaveLength(0);
    expect(resultado.conflictos[0]?.codigo).toBe("SIN_SLOTS_DISPONIBLES");
  });

  it("reporta SIN_SLOTS_DISPONIBLES cuando no existe ningún espacio para una materia presencial", () => {
    const ctx = baseContexto({ espacios: [] });
    const resultado = resolverConBacktrack(ctx, [], 10_000);
    expect(resultado.exito).toBe(false);
    expect(resultado.conflictos[0]?.codigo).toBe("SIN_SLOTS_DISPONIBLES");
  });
});
