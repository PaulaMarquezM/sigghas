import { describe, it, expect } from "vitest";
import {
  formString,
  formNullableString,
  formNumber,
  formBoolean,
  errorMessage,
  firstParam,
  contains,
} from "@/lib/entities";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("formString", () => {
  it("recorta espacios en blanco", () => {
    expect(formString(fd({ nombre: "  Manta  " }), "nombre")).toBe("Manta");
  });

  it("devuelve cadena vacía si la clave no existe", () => {
    expect(formString(fd({}), "nombre")).toBe("");
  });
});

describe("formNullableString", () => {
  it("devuelve null cuando el campo está vacío", () => {
    expect(formNullableString(fd({ nota: "" }), "nota")).toBeNull();
  });

  it("devuelve el string cuando tiene contenido", () => {
    expect(formNullableString(fd({ nota: "ok" }), "nota")).toBe("ok");
  });
});

describe("formNumber", () => {
  it("convierte un string numérico", () => {
    expect(formNumber(fd({ n: "42" }), "n")).toBe(42);
  });

  it("usa el fallback si el valor no es un número finito", () => {
    expect(formNumber(fd({ n: "abc" }), "n", 7)).toBe(7);
  });

  it("usa 0 como fallback por defecto", () => {
    expect(formNumber(fd({}), "n")).toBe(0);
  });
});

describe("formBoolean", () => {
  it.each(["on", "true"])("reconoce '%s' como true", (value) => {
    expect(formBoolean(fd({ activo: value }), "activo")).toBe(true);
  });

  it.each(["off", "false", ""])("reconoce '%s' como false", (value) => {
    expect(formBoolean(fd({ activo: value }), "activo")).toBe(false);
  });

  it("es false cuando el campo no existe (checkbox sin marcar)", () => {
    expect(formBoolean(fd({}), "activo")).toBe(false);
  });
});

describe("errorMessage", () => {
  it("devuelve el mensaje del Error si existe", () => {
    expect(errorMessage(new Error("algo falló"))).toBe("algo falló");
  });

  it("traduce errores conocidos de Auth/DB", () => {
    expect(
      errorMessage(new Error("A user with this email address has already been registered")),
    ).toBe("Este correo ya está registrado.");
  });

  it("devuelve el fallback si no es un Error", () => {
    expect(errorMessage("no soy un error")).toBe(
      "No se pudo guardar. Revisa los datos e intenta nuevamente."
    );
  });

  it("acepta un fallback personalizado", () => {
    expect(errorMessage("x", "otro mensaje")).toBe("otro mensaje");
  });
});

describe("firstParam", () => {
  it("devuelve el primer elemento de un array", () => {
    expect(firstParam(["a", "b"])).toBe("a");
  });

  it("devuelve el valor si es un string", () => {
    expect(firstParam("solo")).toBe("solo");
  });

  it("devuelve cadena vacía si es undefined", () => {
    expect(firstParam(undefined)).toBe("");
  });
});

describe("contains", () => {
  it("es true si needle está vacío", () => {
    expect(contains("cualquier cosa", "")).toBe(true);
  });

  it("compara sin distinguir mayúsculas/minúsculas", () => {
    expect(contains("Programación I", "programacion")).toBe(false); // sin tilde no matchea con tilde
    expect(contains("Programación I", "PROGRAMACIÓN")).toBe(true);
  });

  it("es false cuando el haystack es null/undefined", () => {
    expect(contains(null, "algo")).toBe(false);
  });
});
