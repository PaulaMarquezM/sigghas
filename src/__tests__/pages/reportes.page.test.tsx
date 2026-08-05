import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

const getSessionMock = vi.fn();
const requireRolMock = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: () => getSessionMock(), requireRol: (...args: unknown[]) => requireRolMock(...args) }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

import ReportesRedirectPage from "@/app/dashboard/reportes/page";

describe("ReportesRedirectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("un docente va directo a su PDF", async () => {
    getSessionMock.mockResolvedValue({ perfil: { rol: "docente" } });
    await expect(ReportesRedirectPage()).rejects.toThrow("NEXT_REDIRECT:/api/pdf/mi-horario");
  });

  it("un coordinador ve el módulo de reportes", async () => {
    getSessionMock.mockResolvedValue({ perfil: { rol: "coordinador" } });
    fromMock.mockReturnValue(createChainableQuery(ok(null)));
    await expect(ReportesRedirectPage()).resolves.toBeTruthy();
    expect(requireRolMock).toHaveBeenCalledWith("coordinador", "administrador");
  });
});
