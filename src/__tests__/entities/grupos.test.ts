import { describe, it, expect } from "vitest";
import { payload } from "@/app/dashboard/grupos/validation";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("grupos payload()", () => {
  it("arma el payload correcto y convierte el nombre a mayúsculas", () => {
    const result = payload(
      fd({
        nombre: "sw-5a",
        sede_id: "sede-1",
        semestre: "5",
        cantidad_estudiantes: "30",
        requiere_accesibilidad: "on",
        activo: "on",
      })
    );
    expect(result).toEqual({
      nombre: "SW-5A",
      sede_id: "sede-1",
      semestre: 5,
      cantidad_estudiantes: 30,
      requiere_accesibilidad: true,
      activo: true,
    });
  });

  it("usa 0 cuando faltan semestre/cantidad (FormData ausente => Number(null) => 0)", () => {
    const result = payload(fd({ nombre: "SW-1A", sede_id: "sede-1" }));
    expect(result.semestre).toBe(0);
    expect(result.cantidad_estudiantes).toBe(0);
    expect(result.requiere_accesibilidad).toBe(false);
  });

  it("rechaza cuando falta el nombre", () => {
    expect(() => payload(fd({ sede_id: "sede-1" }))).toThrow("Nombre y sede son obligatorios.");
  });

  it("rechaza cuando falta la sede", () => {
    expect(() => payload(fd({ nombre: "SW-1A" }))).toThrow("Nombre y sede son obligatorios.");
  });
});
