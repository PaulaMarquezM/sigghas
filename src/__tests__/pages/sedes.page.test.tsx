import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "administrador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import SedesPage from "@/app/dashboard/sedes/page";

const sedes = [
  { id: "s-1", nombre: "Manta", es_central: true },
  { id: "s-2", nombre: "Portoviejo", es_central: false },
];

describe("SedesPage (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "administrador" });
    fromMock.mockReturnValue(createChainableQuery(ok(sedes)));
  });

  it("verifica el rol de administrador y lista las sedes", async () => {
    const jsx = await SedesPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(requireRolMock).toHaveBeenCalledWith("administrador");
    expect(screen.getByText("Manta")).toBeTruthy();
    expect(screen.getByText("Central")).toBeTruthy();
    expect(screen.getByText("Portoviejo")).toBeTruthy();
  });

  it("filtra por nombre", async () => {
    const jsx = await SedesPage({ searchParams: Promise.resolve({ q: "Manta" }) });
    render(jsx);
    expect(screen.getByText("Manta")).toBeTruthy();
    expect(screen.queryByText("Portoviejo")).toBeNull();
  });
});
