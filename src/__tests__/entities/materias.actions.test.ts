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

import { createMateria, updateMateria, toggleMateria } from "@/app/dashboard/materias/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = () => fd({ nombre: "Programación I", horas_teoria: "2", horas_practica: "0", modalidad: "presencial" });

describe("materias actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("createMateria: inserta y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(createMateria({ ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/materias");
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador");
    expect(fromMock).toHaveBeenCalledWith("materias");
  });

  it("createMateria: devuelve ok:false si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("duplicate key")));
    const result = await createMateria({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "duplicate key" });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("createMateria: devuelve ok:false si la validación del formulario falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    const result = await createMateria({ ok: true }, fd({}));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/nombre/i);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updateMateria: actualiza y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(updateMateria("m-1", { ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/materias");
  });

  it("toggleMateria: actualiza el estado activo sin lanzar", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(toggleMateria("m-1", false)).resolves.toBeUndefined();
  });

  it("toggleMateria: lanza si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("no encontrado")));
    await expect(toggleMateria("m-1", false)).rejects.toThrow("no encontrado");
  });
});
