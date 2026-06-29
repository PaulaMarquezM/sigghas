import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getHorarioPDF } from "@/app/api/pdf/horario/[horarioId]/route";
import { GET as getMiHorarioPDF } from "@/app/api/pdf/mi-horario/route";

// Mock react-pdf renderer
vi.mock("@react-pdf/renderer", () => ({
  renderToStream: vi.fn().mockResolvedValue({
    pipe: vi.fn(),
  }),
  StyleSheet: {
    create: vi.fn().mockReturnValue({}),
  },
}));

// Mock auth helpers
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({
    user: { id: "user-uuid" },
    perfil: { id: "user-uuid", nombre: "Juan Docente", rol: "docente" },
  }),
}));

const { mockSingle, mockSelect } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  
  // A query object that supports chained .eq().eq() and then() when awaited
  const mockQueryObj: any = {
    single: mockSingle,
    maybeSingle: mockSingle,
  };
  mockQueryObj.eq = vi.fn().mockReturnValue(mockQueryObj);
  mockQueryObj.then = vi.fn().mockImplementation((resolve) => resolve({
    data: [
      { id: "s-1", dia_semana: 1, hora_inicio: "07:00", hora_fin: "09:00", materias: { nombre: "Programacion", codigo: "SW" } }
    ],
    error: null
  }));
  
  const mockSelect = vi.fn().mockReturnValue(mockQueryObj);
  return { mockSingle, mockSelect };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockImplementation((table) => {
      if (table === "horarios" || table === "periodos" || table === "sesiones" || table === "grupos") {
        return {
          select: mockSelect,
        };
      }
      return {};
    }),
  }),
}));

describe("PDF Export Route Handlers Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate full schedule PDF successfully", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "h-1", estado: "publicado", periodos: { nombre: "2026-I" } },
      error: null,
    }); // For horarios select

    const response = await getHorarioPDF(new Request("http://localhost/api/pdf/horario/h-1"), {
      params: Promise.resolve({ horarioId: "h-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("horario-2026-I.pdf");
  });

  it("should generate teacher schedule PDF successfully", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "p-1", nombre: "2026-I", activo: true },
      error: null,
    }); // For periodos active select

    mockSingle.mockResolvedValueOnce({
      data: { id: "h-1", estado: "publicado" },
      error: null,
    }); // For horarios select

    const response = await getMiHorarioPDF(new Request("http://localhost/api/pdf/mi-horario"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("mi-horario.pdf");
  });
});
