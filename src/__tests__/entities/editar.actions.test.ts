import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import { limpiarDuplicadosAction, eliminarHorarioAction } from "@/app/dashboard/editar/actions";

describe("limpiarDuplicadosAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("no hace nada si el periodo tiene 0 o 1 horarios", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok([{ id: "h-1", estado: "borrador", generado_en: "2026-01-01" }])));
    const resultado = await limpiarDuplicadosAction("p-1");
    expect(resultado).toEqual({ exito: true, eliminados: 0 });
  });

  it("elimina historial, sesiones y horarios duplicados, conservando el más reciente", async () => {
    const horarios = [
      { id: "h-nuevo", estado: "borrador", generado_en: "2026-02-01" },
      { id: "h-viejo-1", estado: "borrador", generado_en: "2026-01-15" },
      { id: "h-viejo-2", estado: "borrador", generado_en: "2026-01-01" },
    ];
    fromMock.mockImplementation((table: string) => (table === "horarios" ? createChainableQuery(ok(horarios)) : createChainableQuery(ok())));
    const resultado = await limpiarDuplicadosAction("p-1");
    expect(resultado).toEqual({ exito: true, eliminados: 2 });
    expect(fromMock).toHaveBeenCalledWith("historial_cambios");
    expect(fromMock).toHaveBeenCalledWith("sesiones");
  });

  it("devuelve ok:false si falla la consulta inicial", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("timeout")));
    const resultado = await limpiarDuplicadosAction("p-1");
    expect(resultado).toEqual({ exito: false, eliminados: 0, error: "timeout" });
  });

  it("devuelve ok:false si falla el borrado de sesiones", async () => {
    const horarios = [
      { id: "h-nuevo", estado: "borrador", generado_en: "2026-02-01" },
      { id: "h-viejo", estado: "borrador", generado_en: "2026-01-01" },
    ];
    fromMock.mockImplementation((table: string) => {
      if (table === "horarios") return createChainableQuery(ok(horarios));
      if (table === "sesiones") {
        return createChainableQuery(fail("update or delete on table \"sesiones\" violates foreign key constraint"));
      }
      return createChainableQuery(ok());
    });
    const resultado = await limpiarDuplicadosAction("p-1");
    expect(resultado).toEqual({
      exito: false,
      eliminados: 0,
      error: "No se puede completar la operación porque hay datos relacionados.",
    });
  });
});

describe("eliminarHorarioAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("rechaza horarios publicados", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok({ id: "h-1", estado: "publicado" })));
    const resultado = await eliminarHorarioAction("h-1");
    expect(resultado).toEqual({
      exito: false,
      error: "Un horario publicado no puede eliminarse.",
    });
    expect(fromMock).toHaveBeenCalledWith("horarios");
    expect(fromMock).not.toHaveBeenCalledWith("sesiones");
  });

  it("elimina historial, sesiones y el horario en borrador", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "horarios") return createChainableQuery(ok({ id: "h-1", estado: "borrador" }));
      return createChainableQuery(ok());
    });
    const resultado = await eliminarHorarioAction("h-1");
    expect(resultado).toEqual({ exito: true });
    expect(fromMock).toHaveBeenCalledWith("historial_cambios");
    expect(fromMock).toHaveBeenCalledWith("sesiones");
    expect(fromMock).toHaveBeenCalledWith("horarios");
  });

  it("devuelve error si el horario no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    const resultado = await eliminarHorarioAction("h-missing");
    expect(resultado).toEqual({ exito: false, error: "No se encontró el horario." });
  });

  it("devuelve error localizado si falla el borrado", async () => {
    let horariosCalls = 0;
    fromMock.mockImplementation((table: string) => {
      if (table === "horarios") {
        horariosCalls += 1;
        if (horariosCalls === 1) return createChainableQuery(ok({ id: "h-1", estado: "aprobado" }));
        return createChainableQuery(fail("permission denied for table horarios"));
      }
      return createChainableQuery(ok());
    });
    const resultado = await eliminarHorarioAction("h-1");
    expect(resultado.exito).toBe(false);
    expect(resultado.error).toBeTruthy();
  });
});
