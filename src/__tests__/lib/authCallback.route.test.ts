import { describe, it, expect, vi, beforeEach } from "vitest";

const exchangeCodeForSessionMock = vi.fn();
const verifyOtpMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { exchangeCodeForSession: (...a: unknown[]) => exchangeCodeForSessionMock(...a), verifyOtp: (...a: unknown[]) => verifyOtpMock(...a) },
  }),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("intercambia el código PKCE y redirige al destino", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    const res = await GET(new Request("http://localhost:3000/auth/callback?code=abc123"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("respeta el parámetro next", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    const res = await GET(new Request("http://localhost:3000/auth/callback?code=abc123&next=/dashboard/materias"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/materias");
  });

  it("verifica el token_hash del flujo de confirmación por correo", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    const res = await GET(new Request("http://localhost:3000/auth/callback?token_hash=xyz&type=signup"));
    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "xyz", type: "signup" });
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("redirige a login con error si no hay código ni token válido", async () => {
    const res = await GET(new Request("http://localhost:3000/auth/callback"));
    expect(res.headers.get("location")).toContain("/login?error=");
  });

  it("redirige a login con error si el intercambio de código falla", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: { message: "código inválido" } });
    const res = await GET(new Request("http://localhost:3000/auth/callback?code=malo"));
    expect(res.headers.get("location")).toContain("/login?error=");
  });
});
