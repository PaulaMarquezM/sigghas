import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "administrador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import NuevaSedePage from "@/app/dashboard/sedes/nuevo/page";
import EditarSedePage from "@/app/dashboard/sedes/[id]/page";

describe("NuevaSedePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "administrador" });
  });

  it("muestra el formulario vacío", async () => {
    const jsx = await NuevaSedePage();
    render(jsx);
    expect(screen.getByText("Nueva sede")).toBeTruthy();
  });
});

describe("EditarSedePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "administrador" });
  });

  it("precarga la sede existente", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok({ id: "s-1", nombre: "Manta", es_central: true })));
    const jsx = await EditarSedePage({ params: Promise.resolve({ id: "s-1" }) });
    render(jsx);
    expect(screen.getByText("Editar Manta")).toBeTruthy();
  });

  it("responde 404 si la sede no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(EditarSedePage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
