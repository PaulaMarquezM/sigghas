import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("lib/supabase/client.ts", () => {
  it("crea el cliente de navegador con la URL y anon key configuradas", async () => {
    const createBrowserClientMock = vi.fn().mockReturnValue({ from: vi.fn() });
    vi.doMock("@supabase/ssr", () => ({ createBrowserClient: createBrowserClientMock }));
    const { createClient } = await import("@/lib/supabase/client");
    createClient();
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    vi.doUnmock("@supabase/ssr");
    vi.resetModules();
  });
});

describe("lib/supabase/server.ts", () => {
  it("crea el cliente de servidor leyendo las cookies de next/headers", async () => {
    const cookieStore = { getAll: vi.fn().mockReturnValue([{ name: "sb-token", value: "x" }]), set: vi.fn() };
    vi.doMock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue(cookieStore) }));
    const createServerClientMock = vi.fn().mockReturnValue({ from: vi.fn() });
    vi.doMock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }));

    const { createClient } = await import("@/lib/supabase/server");
    await createClient();

    expect(createServerClientMock).toHaveBeenCalled();
    const cookiesConfig = createServerClientMock.mock.calls[0][2].cookies;
    expect(cookiesConfig.getAll()).toEqual([{ name: "sb-token", value: "x" }]);
    cookiesConfig.setAll([{ name: "a", value: "1", options: {} }]);
    expect(cookieStore.set).toHaveBeenCalledWith("a", "1", {});

    vi.doUnmock("next/headers");
    vi.doUnmock("@supabase/ssr");
    vi.resetModules();
  });
});

describe("lib/supabase/admin.ts", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("requireRolAndAdminClient lanza si falta la service role key", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SERVICE_ROLE_KEY;
    vi.doMock("@/lib/auth", () => ({ requireRol: vi.fn().mockResolvedValue({ id: "u-1", rol: "administrador" }) }));
    const { requireRolAndAdminClient } = await import("@/lib/supabase/admin");
    await expect(requireRolAndAdminClient("administrador")).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    vi.doUnmock("@/lib/auth");
  });

  it("requireRolAndAdminClient verifica el rol antes de entregar el cliente admin", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "administrador" });
    vi.doMock("@/lib/auth", () => ({ requireRol: requireRolMock }));
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn().mockReturnValue({ from: vi.fn() }) }));

    const { requireRolAndAdminClient } = await import("@/lib/supabase/admin");
    const { perfil, admin } = await requireRolAndAdminClient("administrador");

    expect(requireRolMock).toHaveBeenCalledWith("administrador");
    expect(perfil.rol).toBe("administrador");
    expect(admin).toBeDefined();

    vi.doUnmock("@/lib/auth");
    vi.doUnmock("@supabase/supabase-js");
  });
});
