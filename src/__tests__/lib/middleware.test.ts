import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

import { middleware } from "@/middleware";

function makeRequest(pathname: string) {
  return new NextRequest(new URL(pathname, "http://localhost:3000"));
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige a /login cuando no hay sesión y la ruta no es pública", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("deja pasar rutas públicas sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest("/login"));
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirige a /dashboard si hay sesión y visita /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } } });
    const res = await middleware(makeRequest("/login"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("deja pasar rutas protegidas cuando sí hay sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } } });
    const res = await middleware(makeRequest("/dashboard"));
    expect(res.headers.get("location")).toBeNull();
  });
});
