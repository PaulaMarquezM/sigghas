import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "administrador" });
vi.mock("@/lib/auth", () => ({
  requireRol: (...args: unknown[]) => requireRolMock(...args),
  LABEL_ROL: { coordinador: "Coordinador Académico", administrador: "Administrador", apoyo: "Personal de Apoyo", docente: "Docente" },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import UsuariosPage from "@/app/dashboard/usuarios/page";

const usuarios = [
  { id: "u-1", nombre: "Ana Pérez", email: "ana@puce.edu.ec", rol: "coordinador", sede_id: "s-1", activo: true, sedes: { nombre: "Manta" } },
  { id: "u-2", nombre: "Luis Ruiz", email: "luis@puce.edu.ec", rol: "apoyo", sede_id: "s-1", activo: false, sedes: { nombre: "Manta" } },
];

describe("UsuariosPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "administrador" });
    fromMock.mockImplementation((table: string) => (table === "sedes" ? createChainableQuery(ok([])) : createChainableQuery(ok(usuarios))));
  });

  it("verifica el rol administrador y lista todos los usuarios", async () => {
    const jsx = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(requireRolMock).toHaveBeenCalledWith("administrador");
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(screen.getByText("Luis Ruiz")).toBeTruthy();
  });

  it("filtra por rol", async () => {
    const jsx = await UsuariosPage({ searchParams: Promise.resolve({ rol: "apoyo" }) });
    render(jsx);
    expect(screen.queryByText("Ana Pérez")).toBeNull();
    expect(screen.getByText("Luis Ruiz")).toBeTruthy();
  });

  it("filtra por estado activo/inactivo", async () => {
    const jsx = await UsuariosPage({ searchParams: Promise.resolve({ estado: "inactivo" }) });
    render(jsx);
    expect(screen.queryByText("Ana Pérez")).toBeNull();
    expect(screen.getByText("Luis Ruiz")).toBeTruthy();
  });
});
