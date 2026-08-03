import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableQuery, ok, fail } from "@/__tests__/helpers/supabaseMock";

const requireRolMock = vi.fn().mockResolvedValue({ id: "u-1", rol: "coordinador" });
vi.mock("@/lib/auth", () => ({ requireRol: (...args: unknown[]) => requireRolMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({ from: (table: string) => fromMock(table) }) }));

import { actualizarDisponibilidadEspacio } from "@/app/dashboard/configuracion-horario/actions";

function fd(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validForm = () => fd({ dia_semana: "2", hora_inicio: "08:00", hora_fin: "10:00", disponible: "on" });

describe("actualizarDisponibilidadEspacio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRolMock.mockResolvedValue({ id: "u-1", rol: "coordinador" });
  });

  it("actualiza la franja existente sin lanzar cuando los datos son válidos", async () => {
    fromMock.mockReturnValue(createChainableQuery(ok()));
    await expect(actualizarDisponibilidadEspacio("b-1", validForm())).resolves.toBeUndefined();
    expect(fromMock).toHaveBeenCalledWith("disponibilidad_espacio");
  });

  it("lanza si Supabase falla al actualizar", async () => {
    fromMock.mockReturnValue(createChainableQuery(fail("conflicto de horario")));
    await expect(actualizarDisponibilidadEspacio("b-1", validForm())).rejects.toThrow("conflicto de horario");
  });

  it("lanza si la hora de fin no es posterior a la de inicio", async () => {
    await expect(
      actualizarDisponibilidadEspacio("b-1", fd({ dia_semana: "2", hora_inicio: "10:00", hora_fin: "08:00" }))
    ).rejects.toThrow("Indica una franja válida");
  });

  it("lanza si el día está fuera de rango", async () => {
    await expect(
      actualizarDisponibilidadEspacio("b-1", fd({ dia_semana: "9", hora_inicio: "08:00", hora_fin: "10:00" }))
    ).rejects.toThrow("Indica una franja válida");
  });
});
