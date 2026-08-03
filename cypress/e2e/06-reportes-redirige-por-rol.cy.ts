// Regresión del bug 12: /dashboard/reportes era un redirect incondicional a
// /dashboard/mi-horario sin importar el rol. Ahora el docente debe llegar
// directo a su PDF. El rol "estudiante" ya no existe (migración
// 010_remove_rol_estudiante.sql); para un coordinador, mi-horario muestra un
// mensaje de que esa vista es solo para docentes.
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

  it("coordinador: /dashboard/reportes lo manda a mi-horario, que avisa que es solo para docentes", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/reportes");
    cy.url({ timeout: 10000 }).should("include", "/dashboard/mi-horario");
    cy.contains("Esta vista es solo para docentes").should("be.visible");
    cy.screenshot("06-reportes-coordinador-mensaje", { capture: "viewport" });
  });
});
