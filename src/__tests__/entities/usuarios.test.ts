import { describe, it, expect } from "vitest";
import { requireFields } from "@/lib/entities";

describe("usuarios requireFields()", () => {
  it("no lanza cuando todos los campos tienen valor", () => {
    expect(() => requireFields({ Nombre: "Ana", Email: "ana@puce.edu.ec", Rol: "coordinador" })).not.toThrow();
  });

  it("lanza con el nombre del primer campo faltante", () => {
    expect(() => requireFields({ Nombre: "Ana", Email: "", Rol: "coordinador" })).toThrow(
      "Email es obligatorio."
    );
  });
});
