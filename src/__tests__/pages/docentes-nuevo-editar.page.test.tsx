import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));
vi.mock("@/lib/supabase/admin", () => ({ requireRolAndAdminClient: vi.fn() }));

import NuevoDocentePage from "@/app/dashboard/docentes/nuevo/page";
import EditarDocentePage from "@/app/dashboard/docentes/[id]/page";

describe("NuevoDocentePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockReturnValue(createChainableQuery(ok([])));
  });

  it("muestra el formulario vacío", async () => {
    const jsx = await NuevoDocentePage();
    render(jsx);
    expect(screen.getByText("Nuevo docente")).toBeTruthy();
  });
});

describe("EditarDocentePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("precarga el docente existente con su perfil", async () => {
    fromMock.mockImplementation((table: string) =>
      table === "sedes"
        ? createChainableQuery(ok([]))
        : createChainableQuery(ok({ id: "d-1", tipo_contrato: "titular", max_horas_semana: 30, sede_principal_id: "s-1", perfiles: { nombre: "Ana Pérez", email: "ana@puce.edu.ec", activo: true } }))
    );
    const jsx = await EditarDocentePage({ params: Promise.resolve({ id: "d-1" }) });
    render(jsx);
    expect(screen.getByText("Editar Ana Pérez")).toBeTruthy();
  });

  it("responde 404 si el docente no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(EditarDocentePage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
