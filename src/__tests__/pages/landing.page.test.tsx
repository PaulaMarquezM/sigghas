import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/page";

describe("LandingPage", () => {
  it("renderiza sin errores y muestra el nombre del sistema", () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/SIGGHAS/i).length).toBeGreaterThan(0);
  });
});
