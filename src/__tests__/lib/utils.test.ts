import { describe, expect, it } from "vitest";
import { mensajeLegible } from "@/lib/utils";

describe("mensajeLegible", () => {
  it("decodifica escapes unicode que provienen de errores del servidor", () => {
    expect(mensajeLegible("El docente no est\\u00e1 habilitado para impartir clases.")).toBe(
      "El docente no está habilitado para impartir clases."
    );
  });
});
