interface SedeInfo {
  sedeId: string;
  sedeNombre: string;
  docenteId: string;
}

describe("Coordinador — crear espacio", () => {
  const nombre = `E2E-Espacio-${Date.now()}`;
  let sede: SedeInfo;

  before(() => {
    cy.task<SedeInfo>("e2e:primeraSedeYDocente").then((s) => {
      sede = s;
    });
  });

  after(() => {
    cy.task("e2e:borrarEspacioPorNombre", nombre);
  });

  it("crea un espacio (aula) nuevo y aparece en el listado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/espacios/nuevo");
    cy.get("#nombre").type(nombre);
    cy.get("#tipo").select("aula");
    cy.get("#capacidad").clear().type("35");
    cy.get("#sede_id").then(() => {
      cy.get("#sede_id").select(sede.sedeNombre);
    });
    cy.contains("button", "Guardar").click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard/espacios");
    cy.contains(nombre, { timeout: 10000 }).should("be.visible");
    cy.screenshot("12-espacio-creado", { capture: "viewport" });
  });
});
