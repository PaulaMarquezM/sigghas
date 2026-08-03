import { describe, it, expect } from "vitest";
import { requireFields } from "@/lib/entities";

describe("docentes requireFields()", () => {
  it("no lanza cuando todos los campos tienen valor", () => {
    expect(() => requireFields({ Nombre: "Ana", Email: "ana@puce.edu.ec", Sede: "sede-1" })).not.toThrow();
  });

  it("lanza con el nombre del primer campo faltante", () => {
    expect(() => requireFields({ Nombre: "", Email: "ana@puce.edu.ec", Sede: "sede-1" })).toThrow(
      "Nombre es obligatorio."
    );
  });

  it("lanza cuando el valor es null", () => {
    expect(() => requireFields({ Sede: null })).toThrow("Sede es obligatorio.");
  });
});
