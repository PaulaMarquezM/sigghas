import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import PeriodosPage from "@/app/dashboard/periodos/page";

const periodos = [
  { id: "p-1", nombre: "2026-I", fecha_inicio: "2026-01-05", fecha_fin: "2026-06-30", activo: true },
  { id: "p-2", nombre: "2025-II", fecha_inicio: "2025-08-01", fecha_fin: "2025-12-15", activo: false },
];

describe("PeriodosPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockReturnValue(createChainableQuery(ok(periodos)));
  });

  it("lista todos los periodos", async () => {
    const jsx = await PeriodosPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    // "2026-I" está activo: aparece en el banner de "período seleccionado" y en la tabla.
    expect(screen.getAllByText("2026-I").length).toBeGreaterThan(0);
    expect(screen.getByText("2025-II")).toBeTruthy();
  });

  it("filtra por nombre de búsqueda", async () => {
    const jsx = await PeriodosPage({ searchParams: Promise.resolve({ q: "2026" }) });
    render(jsx);
    expect(screen.getAllByText("2026-I").length).toBeGreaterThan(0);
    expect(screen.queryByText("2025-II")).toBeNull();
  });
});
