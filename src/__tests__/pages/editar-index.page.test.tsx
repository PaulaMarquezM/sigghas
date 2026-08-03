import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import EditarHorarioIndexPage from "@/app/dashboard/editar/page";

describe("EditarHorarioIndexPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("muestra el estado vacío cuando no hay horarios para el periodo activo", async () => {
    fromMock.mockImplementation((table: string) => (table === "periodos" ? createChainableQuery(ok([{ id: "p-1", nombre: "2026-I", activo: true }])) : createChainableQuery(ok([]))));
    const jsx = await EditarHorarioIndexPage();
    render(jsx);
    expect(screen.getByText(/no hay horarios generados/i)).toBeTruthy();
  });

  it("lista los horarios marcando el más reciente y muestra el botón de limpiar duplicados", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok([{ id: "p-1", nombre: "2026-I", activo: true }]));
      return createChainableQuery(
        ok([
          { id: "h-2", estado: "publicado", generado_en: "2026-03-02T10:00:00Z", periodo_id: "p-1" },
          { id: "h-1", estado: "borrador", generado_en: "2026-03-01T10:00:00Z", periodo_id: "p-1" },
        ])
      );
    });
    const jsx = await EditarHorarioIndexPage();
    render(jsx);
    expect(screen.getByText("más reciente")).toBeTruthy();
    expect(screen.getByText("Publicado")).toBeTruthy();
    expect(screen.getByText("Borrador")).toBeTruthy();
    expect(screen.getByRole("button", { name: /limpiar 1 duplicado/i })).toBeTruthy();
  });
});
