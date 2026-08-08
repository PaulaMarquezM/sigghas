import { describe, it, expect } from "vitest";
import { generateTempPassword } from "@/lib/temp-password";

describe("generateTempPassword", () => {
  it("genera contraseñas del largo pedido sin caracteres ambiguos", () => {
    const password = generateTempPassword(12);
    expect(password).toHaveLength(12);
    expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
  });
});
