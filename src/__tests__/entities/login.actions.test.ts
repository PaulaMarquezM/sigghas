import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();
const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signInWithPassword: (...a: unknown[]) => signInWithPasswordMock(...a),
      signOut: () => signOutMock(),
    },
    from: (table: string) => fromMock(table),
  }),
}));

import { login, logout } from "@/app/login/actions";
import { createChainableQuery, ok } from "@/__tests__/helpers/supabaseMock";

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
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
    fromMock.mockReturnValue(createChainableQuery(ok({ debe_cambiar_password: false })));
    await expect(login(fd({ email: " Ana@Puce.edu.ec ", password: "secreta" }))).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "ana@puce.edu.ec", password: "secreta" });
  });

  it("login: redirige a /cambiar-password si debe cambiar la contraseña temporal", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
    fromMock.mockReturnValue(createChainableQuery(ok({ debe_cambiar_password: true })));
    await expect(login(fd({ email: "ana@puce.edu.ec", password: "temp123" }))).rejects.toThrow(
      "NEXT_REDIRECT:/cambiar-password",
    );
  });

  it("login: redirige de vuelta a /login con mensaje genérico si las credenciales son incorrectas", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });
    await expect(login(fd({ email: "ana@puce.edu.ec", password: "mala" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/login\?error=Correo/,
    );
  });

  it("login: distingue el caso de correo no confirmado", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: null }, error: { message: "Email not confirmed" } });
    await expect(login(fd({ email: "ana@puce.edu.ec", password: "x" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/login\?error=Tu%20correo/,
    );
  });

  it("logout: cierra sesión y redirige a /login", async () => {
    signOutMock.mockResolvedValue({ error: null });
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(signOutMock).toHaveBeenCalled();
  });
});
