import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import EspaciosPage from "@/app/dashboard/espacios/page";

const espacios = [
  { id: "e-1", nombre: "Aula 101", tipo: "aula", capacidad: 30, sede_id: "s-1", activo: true, sedes: { nombre: "Manta" } },
  { id: "e-2", nombre: "Lab 1", tipo: "laboratorio", capacidad: 25, sede_id: "s-1", activo: false, sedes: { nombre: "Manta" } },
];

describe("EspaciosPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok(espacios))));
  });

  it("lista todos los espacios", async () => {
    const jsx = await EspaciosPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByText("Aula 101")).toBeTruthy();
    expect(screen.getByText("Lab 1")).toBeTruthy();
  });

  it("filtra por tipo de espacio", async () => {
    const jsx = await EspaciosPage({ searchParams: Promise.resolve({ tipo: "laboratorio" }) });
    render(jsx);
    expect(screen.queryByText("Aula 101")).toBeNull();
    expect(screen.getByText("Lab 1")).toBeTruthy();
  });

  it("filtra por estado disponible/inactivo", async () => {
    const jsx = await EspaciosPage({ searchParams: Promise.resolve({ estado: "inactivo" }) });
    render(jsx);
    expect(screen.queryByText("Aula 101")).toBeNull();
    expect(screen.getByText("Lab 1")).toBeTruthy();
  });
});
