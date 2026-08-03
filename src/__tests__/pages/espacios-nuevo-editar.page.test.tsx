import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import NuevoEspacioPage from "@/app/dashboard/espacios/nuevo/page";
import EditarEspacioPage from "@/app/dashboard/espacios/[id]/page";

describe("NuevoEspacioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockReturnValue(createChainableQuery(ok([])));
  });

  it("muestra el formulario vacío", async () => {
    const jsx = await NuevoEspacioPage();
    render(jsx);
    expect(screen.getByText("Nuevo espacio")).toBeTruthy();
  });
});

describe("EditarEspacioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("precarga el espacio existente", async () => {
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok({ id: "e-1", nombre: "Aula 204", tipo: "aula", capacidad: 30, sede_id: "s-1" }))));
    const jsx = await EditarEspacioPage({ params: Promise.resolve({ id: "e-1" }) });
    render(jsx);
    expect(screen.getByText("Editar Aula 204")).toBeTruthy();
  });

  it("responde 404 si el espacio no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(EditarEspacioPage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
