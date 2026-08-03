import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ auth: { signInWithPassword: (...a: unknown[]) => signInWithPasswordMock(...a), signOut: () => signOutMock() } }),
}));

import { login, logout } from "@/app/login/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("login actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login: redirige a /dashboard cuando las credenciales son correctas", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    await expect(login(fd({ email: " Ana@Puce.edu.ec ", password: "secreta" }))).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "ana@puce.edu.ec", password: "secreta" });
  });

  it("login: redirige de vuelta a /login con mensaje genérico si las credenciales son incorrectas", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    await expect(login(fd({ email: "ana@puce.edu.ec", password: "mala" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/login\?error=Correo/
    );
  });

  it("login: distingue el caso de correo no confirmado", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Email not confirmed" } });
    await expect(login(fd({ email: "ana@puce.edu.ec", password: "x" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/login\?error=Tu%20correo/
    );
  });

  it("logout: cierra sesión y redirige a /login", async () => {
    signOutMock.mockResolvedValue({ error: null });
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(signOutMock).toHaveBeenCalled();
  });
});
