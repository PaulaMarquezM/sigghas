import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: () => getSessionMock() }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

import ReportesRedirectPage from "@/app/dashboard/reportes/page";

describe("ReportesRedirectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("un docente va directo a su PDF", async () => {
    getSessionMock.mockResolvedValue({ perfil: { rol: "docente" } });
    await expect(ReportesRedirectPage()).rejects.toThrow("NEXT_REDIRECT:/api/pdf/mi-horario");
  });

  it("cualquier otro rol va a mi-horario", async () => {
    getSessionMock.mockResolvedValue({ perfil: { rol: "coordinador" } });
    await expect(ReportesRedirectPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard/mi-horario");
  });
});
