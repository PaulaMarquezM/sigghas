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

const { mockLimit, mockMaybeSingle, mockOrder, mockSingle, mockSelect } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  
  // A query object that supports the Supabase query chains used by both routes.
  type QueryMock = {
    single: typeof mockSingle;
    maybeSingle: typeof mockMaybeSingle;
    order: typeof mockOrder;
    limit: typeof mockLimit;
    eq: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };
  const mockQueryObj = {} as QueryMock;
  mockQueryObj.single = mockSingle;
  mockQueryObj.maybeSingle = mockMaybeSingle;
  mockQueryObj.order = mockOrder;
  mockQueryObj.limit = mockLimit;
  mockQueryObj.eq = vi.fn().mockReturnValue(mockQueryObj);
  mockOrder.mockReturnValue(mockQueryObj);
  mockLimit.mockReturnValue(mockQueryObj);
  mockQueryObj.then = vi.fn().mockImplementation((resolve) => resolve({
    data: [
      { id: "s-1", dia_semana: 1, hora_inicio: "07:00", hora_fin: "09:00", materias: { nombre: "Programacion", codigo: "SW" } }
    ],
    error: null
  }));
  
  const mockSelect = vi.fn().mockReturnValue(mockQueryObj);
  return { mockLimit, mockMaybeSingle, mockOrder, mockSingle, mockSelect };
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
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "p-1", nombre: "2026-I", activo: true },
      error: null,
    }); // For periodos active select

    mockLimit.mockResolvedValueOnce({
      data: [{ id: "h-1", estado: "publicado" }],
      error: null,
    }); // For latest published horario select

    const response = await getMiHorarioPDF(new Request("http://localhost/api/pdf/mi-horario"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("mi-horario.pdf");
    expect(mockOrder).toHaveBeenCalledWith("generado_en", { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(1);
  });
});
