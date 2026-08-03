import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

const requireRolAndAdminClientMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ requireRolAndAdminClient: (...args: unknown[]) => requireRolAndAdminClientMock(...args) }));

import DocentesPage from "@/app/dashboard/docentes/page";

const docentes = [
  { id: "d-1", tipo_contrato: "tiempo_completo", max_horas_semana: 40, sede_principal_id: "s-1", perfiles: { nombre: "Ana Pérez", email: "ana@puce.edu.ec", activo: true }, sedes: { nombre: "Manta" } },
  { id: "d-2", tipo_contrato: "por_horas", max_horas_semana: 10, sede_principal_id: "s-1", perfiles: { nombre: "Luis Ruiz", email: "luis@puce.edu.ec", activo: false }, sedes: { nombre: "Manta" } },
];

describe("DocentesPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolAndAdminClientMock.mockResolvedValue({
      perfil: { id: "u-1", rol: "coordinador" },
      admin: { from: (table: string) => fromMock(table) },
    });
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok(docentes))));
  });

  it("lista todos los docentes con su contrato y estado", async () => {
    const jsx = await DocentesPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(screen.getByText("Luis Ruiz")).toBeTruthy();
  });

  it("filtra por tipo de contrato", async () => {
    const jsx = await DocentesPage({ searchParams: Promise.resolve({ contrato: "por_horas" }) });
    render(jsx);
    expect(screen.queryByText("Ana Pérez")).toBeNull();
    expect(screen.getByText("Luis Ruiz")).toBeTruthy();
  });

  it("filtra por estado activo/inactivo", async () => {
    const jsx = await DocentesPage({ searchParams: Promise.resolve({ estado: "inactivo" }) });
    render(jsx);
    expect(screen.queryByText("Ana Pérez")).toBeNull();
    expect(screen.getByText("Luis Ruiz")).toBeTruthy();
  });
});
