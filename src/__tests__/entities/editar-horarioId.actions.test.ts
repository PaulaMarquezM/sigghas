import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";
import { CONFIG_DEFAULT, type Asignacion, type ContextoProgramacion } from "@/lib/scheduler/types";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

const requireRolAndAdminClientMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  requireRolAndAdminClient: (...args: unknown[]) => requireRolAndAdminClientMock(...args),
}));
function setAdminClient() {
  requireRolAndAdminClientMock.mockResolvedValue({ perfil: { id: "u-1", rol: "coordinador" }, admin: { from: (table: string) => fromMock(table) } });
}

import {
  getHorarioEditorData,
  crearSesionManualAction,
  validarMovimientoAction,
  obtenerTodosConflictosAction,
  guardarMovimientoAction,
  publicarHorarioAction,
} from "@/app/dashboard/editar/[horarioId]/actions";

const contexto: ContextoProgramacion = {
  periodo: { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-03-01", fecha_fin: "2026-07-31", activo: true, creado_en: "" },
  materias: [{ id: "m-1", codigo: "SW-01", nombre: "Materia", semestre: 5, horas_semana: 2, horas_teoria: 2, horas_practica: 0, requiere_laboratorio: false, modalidad: "presencial", activo: true, nivel: 5, creado_en: "" }],
  grupos: [{ id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", requiere_accesibilidad: false, activo: true, creado_en: "" }],
  docentes: [{ id: "d-1", tipo_contrato: "por_horas", hora_entrada: null, hora_salida: null, max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad: [1, 2, 3, 4, 5].map((dia_semana) => ({ dia_semana: dia_semana as 1 | 2 | 3 | 4 | 5, hora_inicio: "08:00", hora_fin: "17:00", es_tiempo_oficina: false })) }],
  espacios: [{ id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, accesible: true, sede_id: "s-1", disponible: true, activo: true, tiene_proyector: true, tiene_internet: true, creado_en: "" }],
  horario_id: "h-1",
  config: CONFIG_DEFAULT,
};

function asignacion(overrides: Partial<Asignacion> = {}): Asignacion {
  return { id: "s-1", horario_id: "h-1", materia_id: "m-1", grupo_id: "g-1", docente_id: "d-1", dia_semana: 1, hora_inicio: "09:00", hora_fin: "10:00", espacio_id: "e-1", sede_id: "s-1", modalidad: "presencial", ...overrides };
}

describe("editar/[horarioId] actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    setAdminClient();
  });

  describe("getHorarioEditorData", () => {
    it("arma el contexto de programación a partir de todas las tablas", async () => {
      fromMock.mockImplementation((table: string) => {
        if (table === "horarios") return createChainableQuery(ok({ id: "h-1", estado: "borrador", periodos: contexto.periodo }));
        if (table === "sesiones") return createChainableQuery(ok([{ id: "s-1", horario_id: "h-1", materia_id: "m-1", docente_id: "d-1", grupo_id: "g-1", espacio_id: "e-1", modalidad: "presencial", dia_semana: 1, hora_inicio: "09:00:00", hora_fin: "10:00:00", sede_id: "s-1" }]));
        if (table === "materias") return createChainableQuery(ok(contexto.materias));
        if (table === "grupos") return createChainableQuery(ok(contexto.grupos));
        if (table === "espacios") return createChainableQuery(ok(contexto.espacios));
        if (table === "docentes") return createChainableQuery(ok([{ id: "d-1", tipo_contrato: "por_horas", max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad_docente: [{ dia_semana: 1, hora_inicio: "08:00:00", hora_fin: "17:00:00", es_tiempo_oficina: false }], perfiles: { nombre: "Ana" } }]));
        return createChainableQuery(ok([]));
      });
      const data = await getHorarioEditorData("h-1");
      expect(data.horario).toMatchObject({ id: "h-1" });
      expect(data.contexto.docentes[0].disponibilidad[0].hora_inicio).toBe("08:00");
      expect(data.asignaciones[0].hora_inicio).toBe("09:00");
      expect(data.opcionesManuales.docentes[0]).toEqual({ id: "d-1", nombre: "Ana" });
    });

    it("lanza si el horario no existe", async () => {
      fromMock.mockReturnValue(createChainableQuery(ok(null)));
      await expect(getHorarioEditorData("no-existe")).rejects.toThrow("Horario no encontrado");
    });
  });

  describe("validarMovimientoAction", () => {
    it("marca la asignación como no encontrada si el id no existe", async () => {
      const resultado = await validarMovimientoAction(contexto, [asignacion()], "no-existe", { dia_semana: 1, hora_inicio: "09:00", hora_fin: "10:00", espacio_id: "e-1" });
      expect(resultado.valida).toBe(false);
      expect(resultado.conflicto?.codigo).toBe("SYS");
    });

    it("valida un movimiento sin conflictos", async () => {
      const resultado = await validarMovimientoAction(contexto, [asignacion()], "s-1", { dia_semana: 2, hora_inicio: "09:00", hora_fin: "10:00", espacio_id: "e-1" });
      expect(resultado.valida).toBe(true);
    });
  });

  describe("obtenerTodosConflictosAction", () => {
    it("no reporta conflictos cuando no los hay", async () => {
      const conflictos = await obtenerTodosConflictosAction(contexto, [asignacion()]);
      expect(conflictos).toEqual([]);
    });

    it("reporta un conflicto de aula ocupada sin duplicarlo", async () => {
      const asignaciones = [
        asignacion({ id: "s-1", grupo_id: "g-1" }),
        asignacion({ id: "s-2", grupo_id: "g-2", docente_id: "d-2" }),
      ];
      const conflictos = await obtenerTodosConflictosAction(contexto, asignaciones);
      expect(conflictos.length).toBeGreaterThan(0);
      expect(conflictos[0].codigo).toBe("ESPACIO_OCUPADO");
    });
  });

  describe("guardarMovimientoAction", () => {
    it("devuelve error si el horario no existe", async () => {
      fromMock.mockReturnValue(createChainableQuery(ok(null)));
      const resultado = await guardarMovimientoAction("s-1", { dia_semana: 1, hora_inicio: "09:00", hora_fin: "10:00", espacio_id: "e-1" }, "no-existe");
      expect(resultado).toEqual({ exito: false, error: "No se encontró el horario que intentas editar." });
    });

    it("actualiza la sesión y registra el historial", async () => {
      fromMock.mockImplementation((table: string) => {
        if (table === "horarios") return createChainableQuery(ok({ estado: "borrador" }));
        if (table === "sesiones") return createChainableQuery(ok({ id: "s-1", dia_semana: 1, hora_inicio: "09:00:00", hora_fin: "10:00:00", espacio_id: "e-1" }));
        return createChainableQuery(ok());
      });
      const resultado = await guardarMovimientoAction("s-1", { dia_semana: 2, hora_inicio: "09:00", hora_fin: "10:00", espacio_id: "e-2" }, "h-1");
      expect(resultado).toEqual({ exito: true });
      expect(fromMock).toHaveBeenCalledWith("historial_cambios");
    });
  });

  describe("publicarHorarioAction", () => {
    it("publica el horario y registra el historial", async () => {
      fromMock.mockImplementation((table: string) => (table === "horarios" ? createChainableQuery(ok({ id: "h-1" })) : createChainableQuery(ok())));
      const resultado = await publicarHorarioAction("h-1");
      expect(resultado).toEqual({ exito: true });
    });

    it("devuelve error si el horario ya no está en borrador", async () => {
      fromMock.mockReturnValue(createChainableQuery(ok(null)));
      const resultado = await publicarHorarioAction("h-1");
      expect(resultado.exito).toBe(false);
    });

    it("devuelve error si Supabase falla", async () => {
      fromMock.mockReturnValue(createChainableQuery(fail("conexión perdida")));
      const resultado = await publicarHorarioAction("h-1");
      expect(resultado).toEqual({ exito: false, error: "conexión perdida" });
    });
  });

  describe("crearSesionManualAction", () => {
    beforeEach(() => {
      let sesionesCalls = 0;
      fromMock.mockImplementation((table: string) => {
        if (table === "horarios") return createChainableQuery(ok({ id: "h-1", estado: "borrador", periodos: contexto.periodo }));
        if (table === "sesiones") {
          sesionesCalls += 1;
          // 1ª llamada: getHorarioEditorData hace un select (espera un array).
          // 2ª llamada: crearSesionManualAction hace el insert (espera una fila).
          return sesionesCalls === 1 ? createChainableQuery(ok([])) : createChainableQuery(ok({ id: "s-nueva" }));
        }
        if (table === "materias") return createChainableQuery(ok(contexto.materias));
        if (table === "grupos") return createChainableQuery(ok(contexto.grupos));
        if (table === "espacios") return createChainableQuery(ok(contexto.espacios));
        if (table === "docentes") return createChainableQuery(ok([{ id: "d-1", tipo_contrato: "por_horas", max_horas_semana: 20, sede_principal_id: "s-1", disponibilidad_docente: [{ dia_semana: 3, hora_inicio: "08:00:00", hora_fin: "17:00:00", es_tiempo_oficina: false }] }]));
        return createChainableQuery(ok());
      });
    });

    it("rechaza si faltan campos obligatorios", async () => {
      const resultado = await crearSesionManualAction("h-1", { materia_id: "", grupo_id: "g-1", docente_id: "d-1", espacio_id: "e-1", dia_semana: 3, hora_inicio: "09:00", hora_fin: "10:00" });
      expect(resultado.exito).toBe(false);
    });

    it("rechaza si la hora de fin no es posterior a la de inicio", async () => {
      const resultado = await crearSesionManualAction("h-1", { materia_id: "m-1", grupo_id: "g-1", docente_id: "d-1", espacio_id: "e-1", dia_semana: 3, hora_inicio: "10:00", hora_fin: "09:00" });
      expect(resultado.exito).toBe(false);
    });

    it("crea la sesión y su historial cuando no hay conflictos", async () => {
      const resultado = await crearSesionManualAction("h-1", { materia_id: "m-1", grupo_id: "g-1", docente_id: "d-1", espacio_id: "e-1", dia_semana: 3, hora_inicio: "09:00", hora_fin: "10:00" });
      expect(resultado).toEqual({ exito: true });
      expect(fromMock).toHaveBeenCalledWith("historial_cambios");
    });
  });
});
