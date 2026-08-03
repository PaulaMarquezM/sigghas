import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import { createGrupo, updateGrupo, toggleGrupo } from "@/app/dashboard/grupos/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = () => fd({ nombre: "SW-5A", sede_id: "sede-1" });

describe("grupos actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("createGrupo: inserta y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(createGrupo({ ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/grupos");
    expect(fromMock).toHaveBeenCalledWith("grupos");
  });

  it("createGrupo: devuelve ok:false si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("sede inexistente")));
    const result = await createGrupo({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "sede inexistente" });
  });

  it("createGrupo: devuelve ok:false si falta la sede", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    const result = await createGrupo({ ok: true }, fd({ nombre: "SW-5A" }));
    expect(result.ok).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updateGrupo: actualiza y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(updateGrupo("g-1", { ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/grupos");
  });

  it("toggleGrupo: actualiza el estado activo sin lanzar", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(toggleGrupo("g-1", false)).resolves.toBeUndefined();
  });

  it("toggleGrupo: lanza si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("no encontrado")));
    await expect(toggleGrupo("g-1", false)).rejects.toThrow("no encontrado");
  });
});
