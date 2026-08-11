import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); }),
}));
vi.mock("@/lib/errors", () => ({ localizeErrorMessage: (msg: string) => msg }));

const getUserMock = vi.fn();
const updateUserMock = vi.fn();
const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: (...a: unknown[]) => getUserMock(...a), updateUser: (...a: unknown[]) => updateUserMock(...a) },
    from: (table: string) => fromMock(table),
  }),
}));

import { changePassword } from "@/app/cambiar-password/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } } });
    fromMock.mockReturnValue(createChainableQuery(ok()));
  });

  it("redirige a /login si no hay usuario en la sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(
      changePassword({ ok: false }, fd({ password: "clave1234", confirm: "clave1234" }))
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("rechaza contraseñas de menos de 8 caracteres", async () => {
    const resultado = await changePassword({ ok: false }, fd({ password: "corta", confirm: "corta" }));
    expect(resultado).toEqual({ ok: false, message: "La contraseña debe tener al menos 8 caracteres." });
  });

  it("rechaza si la contraseña y la confirmación no coinciden", async () => {
    const resultado = await changePassword({ ok: false }, fd({ password: "clave1234", confirm: "clave5678" }));
    expect(resultado).toEqual({ ok: false, message: "Las contraseñas no coinciden." });
  });

  it("devuelve el error de Supabase si updateUser falla", async () => {
    updateUserMock.mockResolvedValue({ error: { message: "contraseña muy débil" } });
    const resultado = await changePassword({ ok: false }, fd({ password: "clave1234", confirm: "clave1234" }));
    expect(resultado).toEqual({ ok: false, message: "contraseña muy débil" });
  });

  it("avisa si la contraseña se actualiza pero no se puede marcar el perfil", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue(createChainableQuery(fail("no se pudo actualizar perfiles")));
    const resultado = await changePassword({ ok: false }, fd({ password: "clave1234", confirm: "clave1234" }));
    expect(resultado).toEqual({ ok: false, message: "no se pudo actualizar perfiles" });
  });

  it("actualiza la contraseña, marca el perfil y redirige al dashboard", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    await expect(
      changePassword({ ok: false }, fd({ password: "clave1234", confirm: "clave1234" }))
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(updateUserMock).toHaveBeenCalledWith({ password: "clave1234" });
    expect(fromMock).toHaveBeenCalledWith("perfiles");
  });
});
