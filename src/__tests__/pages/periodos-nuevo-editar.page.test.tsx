import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import NuevoPeriodoPage from "@/app/dashboard/periodos/nuevo/page";
import EditarPeriodoPage from "@/app/dashboard/periodos/[id]/page";

describe("NuevoPeriodoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("muestra el formulario vacío", async () => {
    const jsx = await NuevoPeriodoPage();
    render(jsx);
    expect(screen.getByText("Nuevo periodo")).toBeTruthy();
  });
});

describe("EditarPeriodoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("precarga el periodo existente", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok({ id: "p-1", nombre: "2026-I", fecha_inicio: "2026-01-05", fecha_fin: "2026-06-30", activo: true })));
    const jsx = await EditarPeriodoPage({ params: Promise.resolve({ id: "p-1" }) });
    render(jsx);
    expect(screen.getByText("Editar 2026-I")).toBeTruthy();
  });

  it("responde 404 si el periodo no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(EditarPeriodoPage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
