import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "administrador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import NuevoUsuarioPage from "@/app/dashboard/usuarios/nuevo/page";
import EditarUsuarioPage from "@/app/dashboard/usuarios/[id]/page";

describe("NuevoUsuarioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "administrador" });
    fromMock.mockReturnValue(createChainableQuery(ok([])));
  });

  it("muestra el formulario vacío y el enlace a Docentes", async () => {
    const jsx = await NuevoUsuarioPage();
    render(jsx);
    expect(screen.getByText("Nuevo usuario")).toBeTruthy();
    expect(screen.getByRole("link", { name: /docentes/i }).getAttribute("href")).toBe("/dashboard/docentes/nuevo");
  });
});

describe("EditarUsuarioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "administrador" });
  });

  it("precarga el usuario existente", async () => {
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok({ id: "u-2", nombre: "Ana Pérez", rol: "coordinador", sede_id: "s-1", activo: true }))));
    const jsx = await EditarUsuarioPage({ params: Promise.resolve({ id: "u-2" }) });
    render(jsx);
    expect(screen.getByText("Editar Ana Pérez")).toBeTruthy();
  });

  it("redirige a la sección de Docentes si el usuario tiene rol docente", async () => {
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok({ id: "u-3", nombre: "Un Docente", rol: "docente", sede_id: "s-1", activo: true }))));
    await expect(EditarUsuarioPage({ params: Promise.resolve({ id: "u-3" }) })).rejects.toThrow("NEXT_REDIRECT:/dashboard/docentes/u-3");
  });

  it("responde 404 si el usuario no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(EditarUsuarioPage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
