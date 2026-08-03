import { describe, it, expect } from "vitest";
import { payload } from "@/app/dashboard/sedes/validation";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("sedes payload()", () => {
  it("arma el payload correcto", () => {
    const result = payload(fd({ nombre: "Manta", es_central: "on" }));
    expect(result).toEqual({ nombre: "Manta", es_central: true });
  });

  it("por defecto es_central es false", () => {
    const result = payload(fd({ nombre: "Portoviejo" }));
    expect(result.es_central).toBe(false);
  });

  it("rechaza cuando falta el nombre", () => {
    expect(() => payload(fd({}))).toThrow("El nombre es obligatorio.");
  });
});
