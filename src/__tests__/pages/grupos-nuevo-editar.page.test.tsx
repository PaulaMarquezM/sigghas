import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import NuevoGrupoPage from "@/app/dashboard/grupos/nuevo/page";
import EditarGrupoPage from "@/app/dashboard/grupos/[id]/page";

describe("NuevoGrupoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockReturnValue(createChainableQuery(ok([])));
  });

  it("muestra el formulario vacío", async () => {
    const jsx = await NuevoGrupoPage();
    render(jsx);
    expect(screen.getByText("Nuevo curso")).toBeTruthy();
  });
});

describe("EditarGrupoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("precarga el grupo existente", async () => {
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok({ id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1" }))));
    const jsx = await EditarGrupoPage({ params: Promise.resolve({ id: "g-1" }) });
    render(jsx);
    expect(screen.getByText("Editar SW-5A")).toBeTruthy();
  });

  it("responde 404 si el grupo no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(EditarGrupoPage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
