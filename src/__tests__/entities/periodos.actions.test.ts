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

import { createPeriodo, updatePeriodo, togglePeriodo } from "@/app/dashboard/periodos/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = (activo = "") => fd({ nombre: "2026-I", fecha_inicio: "2026-01-05", fecha_fin: "2026-06-30", ...(activo ? { activo } : {}) });

describe("periodos actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("createPeriodo: inserta y redirige cuando todo sale bien (sin activar)", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(createPeriodo({ ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/periodos");
    expect(fromMock).toHaveBeenCalledWith("periodos");
  });

  it("createPeriodo: al activarlo, primero desactiva los demás periodos activos", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(createPeriodo({ ok: true }, validForm("on"))).rejects.toThrow("NEXT_REDIRECT:/dashboard/periodos");
    // Se llama dos veces: una para desactivar los demás, otra para insertar el nuevo.
    expect(fromMock.mock.calls.filter((c) => c[0] === "periodos").length).toBeGreaterThanOrEqual(2);
  });

  it("createPeriodo: devuelve ok:false si Supabase falla al insertar", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("nombre duplicado")));
    const result = await createPeriodo({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "nombre duplicado" });
  });

  it("createPeriodo: devuelve ok:false si la fecha de inicio es posterior a la de fin", async () => {
    const result = await createPeriodo({ ok: true }, fd({ nombre: "2026-I", fecha_inicio: "2026-07-01", fecha_fin: "2026-01-01" }));
    expect(result.ok).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updatePeriodo: actualiza y redirige cuando todo sale bien", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(updatePeriodo("p-1", { ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/periodos");
  });

  it("togglePeriodo: activa el periodo sin lanzar", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(togglePeriodo("p-1", true)).resolves.toBeUndefined();
  });

  it("togglePeriodo: lanza si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("no encontrado")));
    await expect(togglePeriodo("p-1", false)).rejects.toThrow("no encontrado");
  });
});
