import { describe, it, expect } from "vitest";
import { localizeErrorMessage } from "@/lib/errors";

describe("localizeErrorMessage", () => {
  it("traduce email ya registrado de Auth", () => {
    expect(
      localizeErrorMessage("A user with this email address has already been registered"),
    ).toBe("Este correo ya está registrado.");
    expect(localizeErrorMessage("User already registered")).toBe(
      "Este correo ya está registrado.",
    );
  });

  it("traduce credenciales inválidas y correo no confirmado", () => {
    expect(localizeErrorMessage("Invalid login credentials")).toBe(
      "Correo o contraseña incorrectos.",
    );
    expect(localizeErrorMessage("Email not confirmed")).toBe(
      "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.",
    );
  });

  it("traduce errores de Postgres conocidos", () => {
    expect(
      localizeErrorMessage(
        'duplicate key value violates unique constraint "perfiles_email_key"',
      ),
    ).toBe("Ya existe un registro con esos datos.");
    expect(
      localizeErrorMessage(
        'insert or update on table "sesiones" violates foreign key constraint',
      ),
    ).toBe("No se puede completar la operación porque hay datos relacionados.");
  });

  it("oculta errores técnicos no mapeados con el fallback", () => {
    expect(localizeErrorMessage("permission denied for table perfiles")).toBe(
      "No tienes permiso para realizar esta acción.",
    );
    expect(localizeErrorMessage("something violates row integrity")).toBe(
      "No se pudo guardar. Revisa los datos e intenta nuevamente.",
    );
  });

  it("oculta inglés desconocido de backend con el fallback", () => {
    expect(localizeErrorMessage("Database error saving new user")).toBe(
      "No se pudo guardar. Revisa los datos e intenta nuevamente.",
    );
  });

  it("deja intactos los mensajes en español de la app", () => {
    expect(localizeErrorMessage("Selecciona un aula para la clase presencial.")).toBe(
      "Selecciona un aula para la clase presencial.",
    );
  });

  it("usa el fallback cuando el mensaje está vacío", () => {
    expect(localizeErrorMessage("", "fallback custom")).toBe("fallback custom");
    expect(localizeErrorMessage(null)).toBe(
      "No se pudo guardar. Revisa los datos e intenta nuevamente.",
    );
  });
});
