import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
const createUserMock = vi.fn();
const requireRolAndAdminClientMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  requireRolAndAdminClient: (...args: unknown[]) => requireRolAndAdminClientMock(...args),
}));

function setAdminClient() {
  requireRolAndAdminClientMock.mockResolvedValue({
    perfil: { id: "u-1", rol: "administrador" },
    admin: { from: (table: string) => fromMock(table), auth: { admin: { createUser: createUserMock } } },
  });
}

import { createUsuario, updateUsuario, toggleUsuario } from "@/app/dashboard/usuarios/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = (rol = "coordinador") => fd({ nombre: "Ana Pérez", email: "ana@puce.edu.ec", rol, sede_id: "sede-1" });

describe("usuarios actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAdminClient();
  });

  it("createUsuario: crea el usuario auth y su perfil, luego redirige", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(createUsuario({ ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/usuarios");
    expect(requireRolAndAdminClientMock).toHaveBeenCalledWith("administrador");
    expect(fromMock).toHaveBeenCalledWith("perfiles");
  });

  it("createUsuario: rechaza crear un usuario con rol docente desde esta sección", async () => {
    const result = await createUsuario({ ok: true }, validForm("docente"));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/sección Docentes/);
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("createUsuario: devuelve ok:false si falla la creación del usuario en auth", async () => {
    createUserMock.mockResolvedValue({ data: { user: null }, error: { message: "email ya registrado" } });
    const result = await createUsuario({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "email ya registrado" });
  });

  it("createUsuario: devuelve ok:false si falla el upsert del perfil", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    fromMock.mockReturnValue(createChainableQuery(fail("constraint violada")));
    const result = await createUsuario({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "constraint violada" });
  });

  it("updateUsuario: actualiza el perfil y redirige", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(updateUsuario("u-2", { ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/usuarios");
  });

  it("updateUsuario: rechaza asignar el rol docente desde aquí", async () => {
    const result = await updateUsuario("u-2", { ok: true }, validForm("docente"));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/sección Docentes/);
  });

  it("toggleUsuario: activa/desactiva sin lanzar", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(toggleUsuario("u-2", false)).resolves.toBeUndefined();
  });

  it("toggleUsuario: lanza si Supabase falla", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("no encontrado")));
    await expect(toggleUsuario("u-2", false)).rejects.toThrow("no encontrado");
  });
});
