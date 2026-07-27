describe("Navegación del dashboard según el rol", () => {
  it("coordinador ve las herramientas de gestión", () => {
    cy.login("coordinador");
    cy.contains("Generar Horario").should("be.visible");
    cy.contains("Gestionar Grupos").should("be.visible");
    cy.screenshot("07-dashboard-coordinador", { capture: "viewport" });
  });

  it("docente ve su horario y exportar PDF", () => {
    cy.login("docente");
    cy.contains("Ver mi Horario").should("be.visible");
    cy.contains("Exportar PDF").should("be.visible");
    cy.screenshot("07-dashboard-docente", { capture: "viewport" });
  });

  it("estudiante ve su horario y exportar PDF", () => {
    cy.login("estudiante");
    cy.contains("Ver mi Horario").should("be.visible");
    cy.contains("Exportar PDF").should("be.visible");
    cy.screenshot("07-dashboard-estudiante", { capture: "viewport" });
  });
});
