import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession, requireRol } from "@/lib/auth";
import { redirect } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const { mockGetUser, mockFrom, mockSingle } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockImplementation(() => ({ single: mockSingle }));
  const mockFrom = vi.fn().mockImplementation(() => ({ select: vi.fn().mockImplementation(() => ({ eq: mockEq })) }));
  return { mockGetUser, mockFrom, mockSingle };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}));

describe("Authentication Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to /login if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    try {
      await getSession();
    } catch (e) {
      // Catch Next.js redirect if thrown
    }

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("should return user and profile when authenticated successfully", async () => {
    const mockUser = { id: "user-uuid", email: "test@puce.edu.ec" };
    const mockProfile = { id: "user-uuid", nombre: "Juan Pérez", rol: "coordinador" };

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });

    const session = await getSession();

    expect(session.user).toEqual(mockUser);
    expect(session.perfil).toEqual(mockProfile);
  });

  it("should permit requireRol to pass if user role matches", async () => {
    const mockUser = { id: "user-uuid", email: "coord@puce.edu.ec" };
    const mockProfile = { id: "user-uuid", nombre: "Juan Pérez", rol: "coordinador" };

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });

    const perfil = await requireRol("coordinador", "administrador");

    expect(perfil).toEqual(mockProfile);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("should redirect to /dashboard if requireRol role does not match", async () => {
    const mockUser = { id: "user-uuid", email: "student@puce.edu.ec" };
    const mockProfile = { id: "user-uuid", nombre: "Maria Estudiante", rol: "estudiante" };

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });

    try {
      await requireRol("coordinador");
    } catch (e) {
      // Catch redirect
    }

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
