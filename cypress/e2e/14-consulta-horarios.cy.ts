describe("Consulta de Horarios (solo lectura)", () => {
  it("el coordinador puede filtrar por periodo y grupo y ver el horario publicado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/horario");
    cy.wait(1000);
    // Seleccionar por texto en vez de por índice: puede haber varios
    // periodos (activos e inactivos) y no todos tienen un horario publicado;
    // "2026-I" y "SW-1A" sí lo tienen en los datos reales del proyecto.
    cy.get("select").eq(0).select("2026-I (Activo)");
    cy.get("select").eq(1).select("SW-1A (Nivel 1)");
    cy.wait(1000);
    cy.contains("Descargar PDF").should("be.visible");
    cy.screenshot("14-consulta-horarios", { capture: "viewport" });
  });
});
