describe("Consulta de Horarios (solo lectura)", () => {
  it("el coordinador puede filtrar por periodo y grupo y ver el horario publicado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/horario");
    cy.wait(1000);
    cy.get("select").eq(0).select(1);
    cy.get("select").eq(1).select(1);
    cy.wait(1000);
    cy.contains("Descargar PDF").should("be.visible");
    cy.screenshot("14-consulta-horarios", { capture: "viewport" });
  });
});
