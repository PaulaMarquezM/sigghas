// Regresión del bug 12: /dashboard/reportes era un redirect incondicional a
// /dashboard/mi-horario sin importar el rol. Ahora el docente debe llegar
// directo a su PDF, y el coordinador ve la página de reportes académicos
// (indicadores del horario) directamente, sin redirección.
describe("Exportar PDF desde el dashboard — redirige según el rol", () => {
  it("docente: /dashboard/reportes entrega directamente su PDF", () => {
    // reportes/page.tsx llama a redirect() durante un render con streaming:
    // Next.js no manda un 307 en ese caso, sino un 200/HTML con un meta-refresh
    // que solo un navegador real sigue. cy.request no ejecuta ese meta-refresh,
    // así que verificamos la petición de red real con cy.intercept en vez de
    // pedir la ruta directamente.
    cy.intercept("GET", "/api/pdf/mi-horario").as("pdfRequest");
    cy.login("docente");
    cy.visit("/dashboard/reportes", { failOnStatusCode: false });
    cy.wait("@pdfRequest").its("response").then((response) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.headers["content-type"]).to.include("application/pdf");
    });
  });

  it("coordinador: /dashboard/reportes muestra los indicadores del horario sin redirigir", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/reportes");
    cy.url({ timeout: 10000 }).should("include", "/dashboard/reportes");
    cy.contains("Indicadores del horario", { timeout: 10000 }).should("be.visible");
    cy.contains("Sesiones programadas").should("be.visible");
    cy.contains("Carga docente").should("be.visible");
    cy.screenshot("06-reportes-coordinador-indicadores", { capture: "viewport" });
  });
});
