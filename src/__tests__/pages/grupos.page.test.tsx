import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import GruposPage from "@/app/dashboard/grupos/page";

const grupos = [
  { id: "g-1", nombre: "SW-5A", semestre: 5, cantidad_estudiantes: 20, sede_id: "s-1", activo: true, sedes: { nombre: "Manta" } },
  { id: "g-2", nombre: "SW-3A", semestre: 3, cantidad_estudiantes: 25, sede_id: "s-2", activo: false, sedes: { nombre: "Portoviejo" } },
];

describe("GruposPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok(grupos))));
  });

  it("lista todos los cursos con su sede", async () => {
    const jsx = await GruposPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByText("SW-5A")).toBeTruthy();
    expect(screen.getByText("Manta")).toBeTruthy();
    expect(screen.getByText("2 registros")).toBeTruthy();
  });

  it("filtra por semestre", async () => {
    const jsx = await GruposPage({ searchParams: Promise.resolve({ semestre: "3" }) });
    render(jsx);
    expect(screen.queryByText("SW-5A")).toBeNull();
    expect(screen.getByText("SW-3A")).toBeTruthy();
  });

  it("filtra por sede", async () => {
    const jsx = await GruposPage({ searchParams: Promise.resolve({ sede: "s-2" }) });
    render(jsx);
    expect(screen.queryByText("SW-5A")).toBeNull();
    expect(screen.getByText("SW-3A")).toBeTruthy();
  });
});
