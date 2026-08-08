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
    perfil: { id: "u-1", rol: "coordinador" },
    admin: { from: (table: string) => fromMock(table), auth: { admin: { createUser: createUserMock } } },
  });
}

import { createDocente, updateDocente, toggleDocente, saveDisponibilidad } from "@/app/dashboard/docentes/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = () => fd({ nombre: "Ana Pérez", email: "ana@puce.edu.ec", tipo_contrato: "por_horas", sede_principal_id: "sede-1", sedes_ids: "sede-1", max_horas_semana: "20" });

describe("docentes actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAdminClient();
  });

  it("createDocente: crea el usuario auth, el perfil y el registro de docente, y devuelve la contraseña temporal", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const perfilesQuery = createChainableQuery(ok()) as { upsert: ReturnType<typeof vi.fn> };
    perfilesQuery.upsert = vi.fn(() => perfilesQuery);
    fromMock.mockImplementation((table: string) => (table === "perfiles" ? perfilesQuery : createChainableQuery(ok())));

    const result = await createDocente({ ok: true }, validForm());

    expect(result.ok).toBe(true);
    expect(result.email).toBe("ana@puce.edu.ec");
    expect(result.nombre).toBe("Ana Pérez");
    expect(result.tempPassword).toEqual(expect.any(String));
    expect(result.tempPassword!.length).toBeGreaterThanOrEqual(8);
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ana@puce.edu.ec", password: result.tempPassword }),
    );
    expect(perfilesQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ debe_cambiar_password: true, rol: "docente" }),
    );
    expect(fromMock).toHaveBeenCalledWith("docentes");
  });

  it("createDocente: devuelve ok:false si falla la creación del usuario en auth", async () => {
    createUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "A user with this email address has already been registered" },
    });
    const result = await createDocente({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "Este correo ya está registrado." });
  });

  it("createDocente: devuelve ok:false si falla el insert en docentes", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    fromMock.mockImplementation((table: string) =>
      table === "docentes" ? createChainableQuery(fail("tipo_contrato inválido")) : createChainableQuery(ok())
    );
    const result = await createDocente({ ok: true }, validForm());
    expect(result).toEqual({ ok: false, message: "tipo_contrato inválido" });
  });

  it("createDocente: devuelve ok:false si falta un campo requerido", async () => {
    const result = await createDocente({ ok: true }, fd({ nombre: "Ana" }));
    expect(result.ok).toBe(false);
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("createDocente: conserva una carga mínima de 40 horas para tiempo completo", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const docenteQuery = createChainableQuery(ok()) as { insert: ReturnType<typeof vi.fn> };
    docenteQuery.insert = vi.fn(() => docenteQuery);
    fromMock.mockImplementation((table: string) => (table === "docentes" ? docenteQuery : createChainableQuery(ok())));
    const form = fd({
      nombre: "Ana Pérez",
      email: "ana@puce.edu.ec",
      tipo_contrato: "tiempo_completo",
      sede_principal_id: "sede-1",
      sedes_ids: "sede-1",
      max_horas_semana: "20",
    });
    const result = await createDocente({ ok: true }, form);
    expect(result.ok).toBe(true);
    expect(docenteQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ max_horas_semana: 40 }));
  });

  it("updateDocente: actualiza docente y perfil, luego redirige", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(updateDocente("d-1", { ok: true }, validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard/docentes");
  });

  it("toggleDocente: activa/desactiva sin lanzar", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(toggleDocente("d-1", false)).resolves.toBeUndefined();
  });

  it("saveDisponibilidad: borra los bloques anteriores e inserta los nuevos consolidados", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    const formData = new FormData();
    formData.append("bloques", "1-08:00");
    formData.append("bloques", "1-08:30");
    await saveDisponibilidad("d-1", formData);
    expect(fromMock).toHaveBeenCalledWith("disponibilidad_docente");
  });

  it("saveDisponibilidad: solo borra cuando no hay bloques seleccionados", async () => {
    const deleteChain = createChainableQuery(ok());
    fromMock.mockReturnValue(deleteChain);
    await saveDisponibilidad("d-1", new FormData());
    expect(deleteChain.insert).not.toHaveBeenCalled();
  });
});
