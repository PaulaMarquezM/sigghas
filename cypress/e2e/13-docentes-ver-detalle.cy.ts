describe("Coordinador — ver detalle de un docente", () => {
  it("navega del listado al detalle de un docente", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/docentes");
    cy.wait(1000);
    // El sidebar también tiene un link "Editar Horario" — hay que apuntar
    // específicamente al link "Editar" dentro del contenido principal.
    cy.get("main").contains("a", "Editar").first().click();
    cy.url({ timeout: 10000 }).should("match", /\/dashboard\/docentes\/[0-9a-f-]+$/);
    cy.contains(/editar docente/i).should("be.visible");
    cy.screenshot("13-docente-detalle", { capture: "viewport" });
  });
});
