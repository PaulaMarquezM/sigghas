import { describe, it, expect } from "vitest";
import { payload } from "@/app/dashboard/periodos/validation";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("periodos payload()", () => {
  it("arma el payload correcto y convierte el nombre a mayúsculas", () => {
    const result = payload(
      fd({ nombre: "2026-i", fecha_inicio: "2026-01-05", fecha_fin: "2026-06-30", activo: "on" })
    );
    expect(result).toEqual({
      nombre: "2026-I",
      fecha_inicio: "2026-01-05",
      fecha_fin: "2026-06-30",
      activo: true,
    });
  });

  it("rechaza cuando falta algún campo", () => {
    expect(() => payload(fd({ nombre: "2026-I", fecha_inicio: "2026-01-05" }))).toThrow(
      "Todos los campos del periodo son obligatorios."
    );
  });

  it("rechaza cuando la fecha de inicio es posterior a la de fin", () => {
    expect(() =>
      payload(fd({ nombre: "2026-I", fecha_inicio: "2026-07-01", fecha_fin: "2026-01-01" }))
    ).toThrow("La fecha de inicio debe ser menor que la fecha de fin.");
  });

  it("rechaza cuando la fecha de inicio es igual a la de fin", () => {
    expect(() =>
      payload(fd({ nombre: "2026-I", fecha_inicio: "2026-01-01", fecha_fin: "2026-01-01" }))
    ).toThrow("La fecha de inicio debe ser menor que la fecha de fin.");
  });
});
