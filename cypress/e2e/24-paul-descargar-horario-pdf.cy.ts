describe("Paul - descargar horario en PDF", () => {
  it("el coordinador descarga el PDF de un horario publicado", () => {
    cy.intercept("GET", "/api/pdf/horario/*").as("pdfRequest");
    cy.login("coordinador");
    cy.visit("/dashboard/horario");
    cy.get("select").eq(0).select("2026-I (Activo)");
    cy.get("select").eq(1).select("SW-1A (Nivel 1)");
    cy.contains("a", "Descargar PDF", { timeout: 10000 }).click();

    cy.wait("@pdfRequest").its("response").then((response) => {
      expect(response?.statusCode).to.equal(200);
      expect(response?.headers["content-type"]).to.include("application/pdf");
    });
  });
});
