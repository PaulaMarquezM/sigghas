import { describe, it, expect } from "vitest";
import { rn01HorasMaxDocente } from "@/lib/scheduler/rules/rn01-horas-max-docente";
import { rn02Disponibilidad } from "@/lib/scheduler/rules/rn02-disponibilidad";
import { rn03ConflictoAula } from "@/lib/scheduler/rules/rn03-conflicto-aula";
import { rn04ConflictoDocente } from "@/lib/scheduler/rules/rn04-conflicto-docente";
import { rn05CapacidadAula } from "@/lib/scheduler/rules/rn05-capacidad-aula";
import { rn06TipoEspacio } from "@/lib/scheduler/rules/rn06-tipo-espacio";
import { rn07BloquesContiguos } from "@/lib/scheduler/rules/rn07-bloques-contiguos";
import { rn08ConflictoGrupo } from "@/lib/scheduler/rules/rn08-conflicto-grupo";
import { rn09MismaSede } from "@/lib/scheduler/rules/rn09-misma-sede";
import { rn10ClasesVirtuales } from "@/lib/scheduler/rules/rn10-clases-virtuales";
import { rn11DocenteDosSedes } from "@/lib/scheduler/rules/rn11-docente-dos-sedes";
import { rn12RestriccionTipoContrato } from "@/lib/scheduler/rules/rn12-restriccion-tipo-contrato";
import { rn13HorarioInstitucional } from "@/lib/scheduler/rules/rn13-horario-institucional";
import { rn14BloquesTiempoOficina } from "@/lib/scheduler/rules/rn14-bloques-tiempo-oficina";
import { rn15RestriccionAccesibilidad } from "@/lib/scheduler/rules/rn15-restriccion-accesibilidad";
import { rn16SesionesVirtualesCompartidas } from "@/lib/scheduler/rules/rn16-sesiones-virtuales-compartidas";
import type { ContextoProgramacion, Slot, Asignacion } from "@/lib/scheduler/types";

// Base config
const mockConfig = {
  max_intentos_backtrack: 100,
  hora_inicio_jornada: "07:00",
  hora_fin_jornada: "19:00",
  duracion_bloque_minutos: 60,
  dias_laborables: [1, 2, 3, 4, 5] as any[],
};

// Base context
const baseCtx: ContextoProgramacion = {
  periodo: { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-03-01", fecha_fin: "2026-07-31", activo: true, creado_en: "" },
  materias: [
    { id: "m-1", codigo: "SW-01", nombre: "Materia 1", semestre: 5, horas_semana: 4, requiere_laboratorio: false, creado_en: "", nivel: 5, horas_teoria: 2, horas_practica: 2, modalidad: "presencial", activo: true },
    { id: "m-lab", codigo: "SW-02", nombre: "Lab Materia", semestre: 5, horas_semana: 2, requiere_laboratorio: true, creado_en: "", nivel: 5, horas_teoria: 0, horas_practica: 2, modalidad: "presencial", activo: true },
    { id: "m-virtual", codigo: "SW-03", nombre: "Virtual Materia", semestre: 5, horas_semana: 2, requiere_laboratorio: false, creado_en: "", nivel: 5, horas_teoria: 2, horas_practica: 0, modalidad: "virtual", activo: true }
  ],
  grupos: [
    { id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 30, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" },
    { id: "g-acc", nombre: "SW-5B", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: true, activo: true, creado_en: "" }
  ],
  docentes: [
    {
      id: "d-1",
      tipo_contrato: "por_horas",
      hora_entrada: null,
      hora_salida: null,
      max_horas_semana: 10,
      sede_principal_id: "s-1",
      disponibilidad: [
        { dia_semana: 1, hora_inicio: "07:00", hora_fin: "12:00", es_tiempo_oficina: false },
        { dia_semana: 1, hora_inicio: "13:00", hora_fin: "15:00", es_tiempo_oficina: true } // Office block
      ]
    },
    {
      id: "d-tc",
      tipo_contrato: "tiempo_completo",
      hora_entrada: "08:00",
      hora_salida: "16:00",
      max_horas_semana: 40,
      sede_principal_id: "s-1",
      disponibilidad: [
        { dia_semana: 1, hora_inicio: "08:00", hora_fin: "16:00", es_tiempo_oficina: false }
      ]
    }
  ],
  espacios: [
    { id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 40, accesible: true, sede_id: "s-1", disponible: true, creado_en: "", tiene_proyector: true, tiene_internet: true, activo: true },
    { id: "e-small", nombre: "Aula Pequeña", tipo: "aula", capacidad: 15, accesible: false, sede_id: "s-1", disponible: true, creado_en: "", tiene_proyector: true, tiene_internet: true, activo: true },
    { id: "e-lab", nombre: "Lab A", tipo: "laboratorio", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, creado_en: "", tiene_proyector: true, tiene_internet: true, activo: true }
  ],
  horario_id: "h-1",
  config: mockConfig,
};

describe("Scheduler Rules Unit Tests (RN01 - RN16)", () => {
  
  it("RN01 - Horas Max Docente", () => {
    const candidato: Slot = {
      materia_id: "m-1",
      grupo_id: "g-1",
      dia: 1,
      hora_inicio: "07:00",
      hora_fin: "09:00",
      docente_id: "d-1",
      espacio_id: "e-1",
      sede_id: "s-1",
      modalidad: "presencial",
    };

    // 1. Valid case: 0 assigned hours + 2 candidate hours = 2h <= 10h max
    expect(rn01HorasMaxDocente(candidato, baseCtx, []).valida).toBe(true);

    // 2. Invalid case: 9 assigned hours + 2 candidate hours = 11h > 10h max
    const asignadas: Asignacion[] = [
      { horario_id: "h-1", materia_id: "m-1", docente_id: "d-1", grupo_id: "g-1", espacio_id: "e-1", modalidad: "presencial", dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00", sede_id: "s-1" }
    ];
    const res = rn01HorasMaxDocente(candidato, baseCtx, asignadas);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("EXCEDE_MAX_HORAS");
    }
  });

  it("RN02 - Disponibilidad Docente", () => {
    // 1. Valid: Monday 07:00-09:00 (within d-1 availability 07:00-12:00)
    const slotValido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    expect(rn02Disponibilidad(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: Monday 12:00-14:00 (outside d-1 availability)
    const slotInvalido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "12:00", hora_fin: "14:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    const res = rn02Disponibilidad(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("DOCENTE_NO_DISPONIBLE");
    }
  });

  it("RN03 - Conflicto de Aula", () => {
    const candidato: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };

    // 1. Valid: space e-1 is free
    expect(rn03ConflictoAula(candidato, baseCtx, []).valida).toBe(true);

    // 2. Invalid: space e-1 is occupied at 08:00
    const asignadas: Asignacion[] = [
      { horario_id: "h-1", materia_id: "m-1", docente_id: "d-tc", grupo_id: "g-acc", espacio_id: "e-1", modalidad: "presencial", dia_semana: 1, hora_inicio: "08:00", hora_fin: "10:00", sede_id: "s-1" }
    ];
    const res = rn03ConflictoAula(candidato, baseCtx, asignadas);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("AULA_OCUPADA");
    }
  });

  it("RN04 - Conflicto de Docente", () => {
    const candidato: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };

    // 1. Valid: teacher d-1 has no classes
    expect(rn04ConflictoDocente(candidato, baseCtx, []).valida).toBe(true);

    // 2. Invalid: teacher d-1 has class at 08:00
    const asignadas: Asignacion[] = [
      { horario_id: "h-1", materia_id: "m-lab", docente_id: "d-1", grupo_id: "g-acc", espacio_id: "e-lab", modalidad: "presencial", dia_semana: 1, hora_inicio: "08:00", hora_fin: "09:00", sede_id: "s-1" }
    ];
    const res = rn04ConflictoDocente(candidato, baseCtx, asignadas);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("DOCENTE_OCUPADO");
    }
  });

  it("RN05 - Capacidad de Aula", () => {
    // 1. Valid: group g-1 (30 students) in classroom e-1 (40 capacity)
    const slotValido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    expect(rn05CapacidadAula(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: group g-1 (30 students) in classroom e-small (15 capacity)
    const slotInvalido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-small", sede_id: "s-1", modalidad: "presencial"
    };
    const res = rn05CapacidadAula(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("CAPACIDAD_INSUFICIENTE");
    }
  });

  it("RN06 - Tipo de Espacio (Laboratorios)", () => {
    // 1. Valid: Lab materia m-lab in laboratory space e-lab
    const slotValido: Slot = {
      materia_id: "m-lab", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-lab", sede_id: "s-1", modalidad: "presencial"
    };
    expect(rn06TipoEspacio(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: Lab materia m-lab in standard classroom e-1
    const slotInvalido: Slot = {
      materia_id: "m-lab", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    const res = rn06TipoEspacio(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("REQUIERE_LABORATORIO");
    }
  });

  it("RN07 - Bloques Contiguos", () => {
    const slot: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    // RN07 checks contiguous block bounds. It should validate true for normal blocks.
    expect(rn07BloquesContiguos(slot, baseCtx, []).valida).toBe(true);
  });

  it("RN08 - Conflicto de Grupo", () => {
    const candidato: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };

    // 1. Valid: group g-1 is free
    expect(rn08ConflictoGrupo(candidato, baseCtx, []).valida).toBe(true);

    // 2. Invalid: group g-1 is already in class at 08:00
    const asignadas: Asignacion[] = [
      { horario_id: "h-1", materia_id: "m-lab", docente_id: "d-tc", grupo_id: "g-1", espacio_id: "e-lab", modalidad: "presencial", dia_semana: 1, hora_inicio: "08:00", hora_fin: "10:00", sede_id: "s-1" }
    ];
    const res = rn08ConflictoGrupo(candidato, baseCtx, asignadas);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("GRUPO_OCUPADO");
    }
  });

  it("RN09 - Misma Sede para Clases Presenciales", () => {
    // 1. Valid: group g-1 (sede s-1) in classroom e-1 (sede s-1)
    const slotValido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    expect(rn09MismaSede(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: group g-1 (sede s-1) in classroom in different sede
    const slotInvalido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "diferente-sede", modalidad: "presencial"
    };
    const res = rn09MismaSede(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("SEDE_INCORRECTA");
    }
  });

  it("RN10 - Clases Virtuales sin aula física", () => {
    // 1. Valid: virtual class has no classroom (espacio_id = null)
    const slotValido: Slot = {
      materia_id: "m-virtual", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: null, sede_id: "virtual", modalidad: "virtual"
    };
    expect(rn10ClasesVirtuales(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: virtual class has a classroom
    const slotInvalido: Slot = {
      materia_id: "m-virtual", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "virtual"
    };
    const res = rn10ClasesVirtuales(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("MATERIA_VIRTUAL_NO_PRESENCIAL");
    }
  });

  it("RN11 - Docente en dos sedes el mismo día", () => {
    const candidato: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };

    // 1. Valid: teacher only has classes in sede s-1
    expect(rn11DocenteDosSedes(candidato, baseCtx, []).valida).toBe(true);

    // 2. Invalid: teacher has a class in different sede "s-2" on the same day
    const asignadas: Asignacion[] = [
      { horario_id: "h-1", materia_id: "m-lab", docente_id: "d-1", grupo_id: "g-acc", espacio_id: "e-lab", modalidad: "presencial", dia_semana: 1, hora_inicio: "10:00", hora_fin: "12:00", sede_id: "s-2" }
    ];
    const res = rn11DocenteDosSedes(candidato, baseCtx, asignadas);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("DOCENTE_DOS_SEDES");
    }
  });

  it("RN12 - Restricciones de Tipo de Contrato", () => {
    const slot: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    // Checks type limits. Valid case should pass.
    expect(rn12RestriccionTipoContrato(slot, baseCtx, []).valida).toBe(true);
  });

  it("RN13 - Horario Institucional", () => {
    // 1. Valid: 08:00 to 10:00 (within 07:00-19:00)
    const slotValido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "08:00", hora_fin: "10:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    expect(rn13HorarioInstitucional(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: 06:00 to 08:00 (outside limits for TC docente d-tc)
    const slotInvalido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "06:00", hora_fin: "08:00",
      docente_id: "d-tc", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    const res = rn13HorarioInstitucional(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("FUERA_DE_HORARIO_INSTITUCIONAL");
    }
  });

  it("RN14 - Bloques de Tiempo Oficina (RN07)", () => {
    // 1. Valid: Monday 07:00-09:00 (not office hours)
    const slotValido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    expect(rn14BloquesTiempoOficina(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: Monday 13:00-14:00 (is blocked office hours for d-1)
    const slotInvalido: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "13:00", hora_fin: "14:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    const res = rn14BloquesTiempoOficina(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("BLOQUE_TIEMPO_OFICINA");
    }
  });

  it("RN15 - Restricción de Accesibilidad", () => {
    // 1. Valid: group g-acc (requires access) in classroom e-1 (is accessible)
    const slotValido: Slot = {
      materia_id: "m-1", grupo_id: "g-acc", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial"
    };
    expect(rn15RestriccionAccesibilidad(slotValido, baseCtx, []).valida).toBe(true);

    // 2. Invalid: group g-acc (requires access) in classroom e-small (not accessible)
    const slotInvalido: Slot = {
      materia_id: "m-1", grupo_id: "g-acc", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: "e-small", sede_id: "s-1", modalidad: "presencial"
    };
    const res = rn15RestriccionAccesibilidad(slotInvalido, baseCtx, []);
    expect(res.valida).toBe(false);
    if (!res.valida) {
      expect(res.conflicto.codigo).toBe("ESPACIO_NO_ACCESIBLE");
    }
  });

  it("RN16 - Sesiones Virtuales Compartidas", () => {
    const slot: Slot = {
      materia_id: "m-1", grupo_id: "g-1", dia: 1, hora_inicio: "07:00", hora_fin: "09:00",
      docente_id: "d-1", espacio_id: null, sede_id: "virtual", modalidad: "virtual"
    };
    // Normal single virtual slot passes check.
    expect(rn16SesionesVirtualesCompartidas(slot, baseCtx, []).valida).toBe(true);
  });
});
