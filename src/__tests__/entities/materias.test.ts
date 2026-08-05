import { describe, it, expect } from "vitest";
import { payload } from "@/app/dashboard/materias/validation";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("materias payload()", () => {
  it("arma el payload correcto con datos válidos", () => {
    const result = payload(
      fd({
        codigo: "sw101",
        nombre: "Programación I",
        nivel: "3",
        horas_teoria: "2",
        horas_practica: "1",
        modalidad: "presencial",
        activo: "on",
      })
    );
    expect(result).toEqual({
      codigo: "SW101",
      nombre: "Programación I",
      semestre: 3,
      nivel: 3,
      horas_semana: 3,
      horas_teoria: 2,
      horas_practica: 1,
      modalidad: "presencial",
      requiere_laboratorio: false,
      activo: true,
    });
  });

  it("genera un código automático cuando no se escribe ninguno", () => {
    const result = payload(fd({ nombre: "Cálculo", horas_teoria: "2", horas_practica: "0" }));
    expect(result.codigo).toMatch(/^MAT-[A-F0-9]{8}$/);
  });

  it("rechaza un nombre vacío", () => {
    expect(() => payload(fd({ horas_teoria: "1", horas_practica: "0" }))).toThrow(
      "Escribe el nombre de la materia para continuar."
    );
  });

  it("rechaza 0 horas semanales", () => {
    expect(() => payload(fd({ nombre: "X", horas_teoria: "0", horas_practica: "0" }))).toThrow(
      /entre 0,5 y 6 horas/
    );
  });

  it("rechaza más de 6 horas semanales", () => {
    expect(() => payload(fd({ nombre: "X", horas_teoria: "5", horas_practica: "2" }))).toThrow(
      /entre 0,5 y 6 horas/
    );
  });

  it("rechaza horas que no son múltiplos de 30 minutos", () => {
    expect(() => payload(fd({ nombre: "X", horas_teoria: "1.3", horas_practica: "0" }))).toThrow(
      /intervalos de 30 minutos/
    );
  });

});
