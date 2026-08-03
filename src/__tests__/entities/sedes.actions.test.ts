import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "administrador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import { createSede, updateSede } from "@/app/dashboard/sedes/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = () => fd({ nombre: "Manta", es_central: "on" });

describe("sedes actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "administrador" });
  });

  it("createSede: inserta y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(createSede({ ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/sedes");
    expect(requireRolMock).toHaveBeenCalledWith("administrador");
    expect(fromMock).toHaveBeenCalledWith("sedes");
  });

  it("createSede: devuelve ok:false si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("nombre duplicado")));
    const result = await createSede({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "nombre duplicado" });
  });

  it("createSede: devuelve ok:false si falta el nombre", async () => {
    const result = await createSede({ ok: true }, fd({}));
    expect(result.ok).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updateSede: actualiza y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(updateSede("s-1", { ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/sedes");
  });
});
