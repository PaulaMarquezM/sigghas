import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import NuevaMateriaPage from "@/app/dashboard/materias/nuevo/page";
import EditarMateriaPage from "@/app/dashboard/materias/[id]/page";

describe("NuevaMateriaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("verifica el rol y muestra el formulario vacío", async () => {
    const jsx = await NuevaMateriaPage();
    render(jsx);
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador");
    expect(screen.getByText("Nueva materia")).toBeTruthy();
  });
});

describe("EditarMateriaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("precarga la materia existente en el formulario", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok({ id: "m-1", nombre: "Programación I", codigo: "SW-101", nivel: 3, horas_teoria: 2, horas_practica: 1, modalidad: "presencial" })));
    const jsx = await EditarMateriaPage({ params: Promise.resolve({ id: "m-1" }) });
    render(jsx);
    expect(screen.getByText("Editar Programación I")).toBeTruthy();
    expect((screen.getByLabelText(/código/i) as HTMLInputElement).value).toBe("SW-101");
  });

  it("responde 404 si la materia no existe", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(EditarMateriaPage({ params: Promise.resolve({ id: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
