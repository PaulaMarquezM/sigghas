import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

import { Sidebar } from "@/components/layout/sidebar";

describe("Sidebar", () => {
  it("se puede volver a expandir después de contraerlo", () => {
    render(<Sidebar nombre="Ana Pérez" rol="coordinador" />);

    fireEvent.click(screen.getByRole("button", { name: "Contraer menú" }));
    expect(screen.getByRole("button", { name: "Expandir menú" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Expandir menú" }));
    expect(screen.getByText("SIGGHAS")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Contraer menú" })).toBeTruthy();
  });
});
