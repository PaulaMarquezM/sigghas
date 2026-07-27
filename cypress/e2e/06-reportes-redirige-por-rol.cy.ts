// Regresión del bug 12: /dashboard/reportes era un redirect incondicional a
// /dashboard/mi-horario sin importar el rol. Ahora el docente debe llegar
// directo a su PDF, y el estudiante al selector de grupo.
describe("Exportar PDF desde el dashboard — redirige según el rol", () => {
  it("docente: /dashboard/reportes entrega directamente su PDF", () => {
    cy.login("docente");
    cy.request("/dashboard/reportes").then((res) => {
      expect(res.status).to.eq(200);
      expect(res.headers["content-type"]).to.include("application/pdf");
    });
  });

  it("estudiante: /dashboard/reportes lo manda al selector de grupo", () => {
    cy.login("estudiante");
    cy.visit("/dashboard/reportes");
    cy.url({ timeout: 10000 }).should("include", "/dashboard/mi-horario");
    cy.contains("Selecciona tu Grupo Académico").should("be.visible");
    cy.screenshot("06-reportes-estudiante-selector", { capture: "viewport" });
  });
});
