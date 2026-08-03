import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const getSessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: () => getSessionMock() }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path), usePathname: () => "/dashboard" }));
// sonner's Toaster usa window.matchMedia, que jsdom no implementa; no es
// código propio del proyecto, así que se reemplaza por un stub inerte.
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

import DashboardLayout from "@/app/dashboard/layout";

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige a /registro si no hay perfil", async () => {
    getSessionMock.mockResolvedValue({ perfil: null });
    await expect(DashboardLayout({ children: <div /> })).rejects.toThrow(/NEXT_REDIRECT:\/registro/);
  });

  it("renderiza el sidebar, el topbar y el contenido cuando hay sesión", async () => {
    getSessionMock.mockResolvedValue({ perfil: { nombre: "Ana Pérez", rol: "coordinador" } });
    const jsx = await DashboardLayout({ children: <div>contenido hijo</div> });
    render(jsx);
    expect(screen.getByText("contenido hijo")).toBeTruthy();
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
  });
});
