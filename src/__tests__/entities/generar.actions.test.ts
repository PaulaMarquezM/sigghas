import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const generateMock = vi.fn();
vi.mock("@/lib/scheduler", () => ({ generate: (...args: unknown[]) => generateMock(...args) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import { generarHorario, crearHorarioManual, verificarHorarioExistente } from "@/app/dashboard/generar/actions";

describe("generar actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("generarHorario: verifica el rol y delega en el motor generate()", async () => {
    generateMock.mockResolvedValue({ exito: true, log: [] });
    const resultado = await generarHorario("p-1", null);
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador");
    expect(generateMock).toHaveBeenCalledWith("p-1", null, {});
    expect(resultado).toEqual({ exito: true, log: [] });
  });

  it("crearHorarioManual: rechaza sin periodoId", async () => {
    const resultado = await crearHorarioManual("");
    expect(resultado).toEqual({ exito: false, error: "Selecciona un período académico." });
  });

  it("crearHorarioManual: reutiliza un borrador existente si ya hay uno", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok([{ id: "h-existente" }])));
    const resultado = await crearHorarioManual("p-1");
    expect(resultado).toEqual({ exito: true, horario_id: "h-existente" });
  });

  it("crearHorarioManual: crea un horario nuevo en borrador si no hay ninguno", async () => {
    const limitChain = createChainableQuery(ok([]));
    const insertChain = createChainableQuery(ok({ id: "h-nuevo" }));
    fromMock.mockReturnValueOnce(limitChain).mockReturnValueOnce(insertChain);
    const resultado = await crearHorarioManual("p-1");
    expect(resultado).toEqual({ exito: true, horario_id: "h-nuevo" });
  });

  it("verificarHorarioExistente: informa que no existe cuando no hay horarios para el periodo", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok([])));
    const resultado = await verificarHorarioExistente("p-1");
    expect(resultado).toEqual({ existe: false, id: null, estado: null, generado_en: null });
  });

  it("verificarHorarioExistente: informa el estado del horario más reciente", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok([{ id: "h-1", estado: "borrador", generado_en: "2026-01-01" }])));
    const resultado = await verificarHorarioExistente("p-1");
    expect(resultado).toEqual({ existe: true, id: "h-1", estado: "borrador", generado_en: "2026-01-01" });
  });
});
