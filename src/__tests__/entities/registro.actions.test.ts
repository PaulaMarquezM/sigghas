import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map([["x-forwarded-proto", "https"], ["host", "sigghas.test"]])),
}));

const signUpMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ auth: { signUp: (...a: unknown[]) => signUpMock(...a) } }),
}));

import { register } from "@/app/registro/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = () => fd({ nombre: "Ana Pérez", email: "ana@puce.edu.ec", password: "secreta123", rol: "estudiante" });

describe("registro actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register: con sesión inmediata redirige a /dashboard", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u-1" }, session: { access_token: "t" } }, error: null });
    await expect(register(validForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("register: sin sesión inmediata redirige a /login pidiendo confirmar el correo", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u-1" }, session: null }, error: null });
    await expect(register(validForm())).rejects.toThrow(/NEXT_REDIRECT:\/login\?msg=/);
  });

  it("register: correo ya registrado muestra el mensaje correspondiente", async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: { message: "User already registered" } });
    await expect(register(validForm())).rejects.toThrow(/NEXT_REDIRECT:\/registro\?error=/);
  });

  it("register: usa la metadata correcta (nombre/rol) al llamar signUp", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u-1" }, session: { access_token: "t" } }, error: null });
    await expect(register(validForm())).rejects.toThrow();
    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ana@puce.edu.ec",
        options: expect.objectContaining({ data: { nombre: "Ana Pérez", rol: "estudiante" } }),
      })
    );
  });
});
