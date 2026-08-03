import { describe, it, expect } from "vitest";
import { payload } from "@/app/dashboard/espacios/validation";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("espacios payload()", () => {
  it("arma el nombre a partir del prefijo del tipo y el número", () => {
    const result = payload(fd({ numero: "204", sede_id: "sede-1", tipo: "aula", capacidad: "35" }));
    expect(result.nombre).toBe("Aula 204");
    expect(result.sede_id).toBe("sede-1");
    expect(result.capacidad).toBe(35);
  });

  it.each([
    ["laboratorio", "Laboratorio"],
    ["auditorio", "Auditorio"],
    ["sala_reuniones", "Sala"],
    ["aula", "Aula"],
  ])("usa el prefijo correcto para tipo=%s", (tipo, prefijo) => {
    const result = payload(fd({ numero: "1", sede_id: "sede-1", tipo }));
    expect(result.nombre).toBe(`${prefijo} 1`);
  });

  it("elimina caracteres inválidos del número", () => {
    const result = payload(fd({ numero: "20-4 B!", sede_id: "sede-1", tipo: "aula" }));
    expect(result.nombre).toBe("Aula 20-4B");
  });

  it("marca disponible igual al valor de activo", () => {
    const result = payload(fd({ numero: "1", sede_id: "sede-1", tipo: "aula", activo: "on" }));
    expect(result.activo).toBe(true);
    expect(result.disponible).toBe(true);
  });

  it("rechaza cuando falta el número", () => {
    expect(() => payload(fd({ sede_id: "sede-1", tipo: "aula" }))).toThrow(
      "Indica el número del aula y selecciona una sede."
    );
  });

  it("rechaza cuando falta la sede", () => {
    expect(() => payload(fd({ numero: "1", tipo: "aula" }))).toThrow(
      "Indica el número del aula y selecciona una sede."
    );
  });
});
