import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import { limpiarDuplicadosAction } from "@/app/dashboard/editar/actions";

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
      if (table === "sesiones") return createChainableQuery(fail("FK violation"));
      return createChainableQuery(ok());
    });
    const resultado = await limpiarDuplicadosAction("p-1");
    expect(resultado).toEqual({ exito: false, eliminados: 0, error: "FK violation" });
  });
});
