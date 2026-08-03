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

import { createEspacio, updateEspacio, toggleEspacio } from "@/app/dashboard/espacios/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = () => fd({ numero: "204", sede_id: "sede-1", tipo: "aula" });

describe("espacios actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("createEspacio: inserta el aula, su disponibilidad de lunes a viernes y redirige", async () => {
    const espaciosChain = createChainableQuery(ok({ id: "e-1" }));
    const disponibilidadChain = createChainableQuery(ok());
    fromMock.mockImplementation((table: string) => (table === "espacios" ? espaciosChain : disponibilidadChain));

    await expect(createEspacio({ ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/espacios");
    expect(fromMock).toHaveBeenCalledWith("espacios");
    expect(fromMock).toHaveBeenCalledWith("disponibilidad_espacio");
  });

  it("createEspacio: devuelve ok:false si Supabase falla al insertar el aula", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("numero duplicado")));
    const result = await createEspacio({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "numero duplicado" });
  });

  it("createEspacio: devuelve ok:false si falta el número", async () => {
    const result = await createEspacio({ ok: true }, fd({ sede_id: "sede-1", tipo: "aula" }));
    expect(result.ok).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updateEspacio: actualiza y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(updateEspacio("e-1", { ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/espacios");
  });

  it("toggleEspacio: actualiza disponible/activo sin lanzar", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(toggleEspacio("e-1", false)).resolves.toBeUndefined();
  });

  it("toggleEspacio: lanza si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("no encontrado")));
    await expect(toggleEspacio("e-1", false)).rejects.toThrow("no encontrado");
  });
});
