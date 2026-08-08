import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

import RegisterPage from "@/app/registro/page";

describe("RegisterPage", () => {
  it("explica que el docente lo registra el coordinador e invita a iniciar sesión", () => {
    render(<RegisterPage />);
    expect(screen.getByText(/los docentes no se auto-registran/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /ir a iniciar sesión/i })).toBeTruthy();
  });
});
