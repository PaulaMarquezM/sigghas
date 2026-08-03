import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args), LABEL_ROL: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import MateriasPage from "@/app/dashboard/materias/page";

const materias = [
  { id: "m-1", codigo: "SW-101", nombre: "Programación I", nivel: 3, horas_teoria: 2, horas_practica: 1, modalidad: "presencial", requiere_laboratorio: false, activo: true },
  { id: "m-2", codigo: "SW-202", nombre: "Bases de Datos", nivel: 5, horas_teoria: 2, horas_practica: 0, modalidad: "virtual", requiere_laboratorio: false, activo: false },
];

describe("MateriasPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
    fromMock.mockReturnValue(createChainableQuery(ok(materias)));
  });

  it("verifica el rol y lista todas las materias", async () => {
    const jsx = await MateriasPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador");
    expect(screen.getByText("Programación I")).toBeTruthy();
    expect(screen.getByText("Bases de Datos")).toBeTruthy();
    expect(screen.getByText("2 registros")).toBeTruthy();
  });

  it("filtra por texto de búsqueda (nombre o código)", async () => {
    const jsx = await MateriasPage({ searchParams: Promise.resolve({ q: "SW-101" }) });
    render(jsx);
    expect(screen.getByText("Programación I")).toBeTruthy();
    expect(screen.queryByText("Bases de Datos")).toBeNull();
  });

  it("filtra por nivel", async () => {
    const jsx = await MateriasPage({ searchParams: Promise.resolve({ nivel: "5" }) });
    render(jsx);
    expect(screen.queryByText("Programación I")).toBeNull();
    expect(screen.getByText("Bases de Datos")).toBeTruthy();
  });

  it("filtra por estado activo/inactivo", async () => {
    const jsx = await MateriasPage({ searchParams: Promise.resolve({ estado: "inactivo" }) });
    render(jsx);
    expect(screen.queryByText("Programación I")).toBeNull();
    expect(screen.getByText("Bases de Datos")).toBeTruthy();
  });
});
