import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import GenerarPage from "@/app/dashboard/generar/page";

describe("GenerarPage (Server Component + GenerarForm)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    const countResult = { data: null, error: null, count: 5 };
    fromMock.mockImplementation((table: string) => {
      if (table === "periodos") return createChainableQuery(ok([{ id: "p-1", nombre: "2026-I" }]));
      return createChainableQuery(countResult);
    });
  });

  it("muestra el título, los contadores y el formulario de generación", async () => {
    const jsx = await GenerarPage();
    render(jsx);
    expect(screen.getByText("Generar Horario Automático")).toBeTruthy();
    expect(screen.getByText(/período académico/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /generar automáticamente/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /crear manualmente/i })).toBeTruthy();
  });

  it("lista el periodo disponible en el select", async () => {
    const jsx = await GenerarPage();
    render(jsx);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(Array.from(select.options).some((o) => o.textContent === "2026-I")).toBe(true);
  });
});
