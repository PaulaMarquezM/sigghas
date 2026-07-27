interface SedeInfo {
  sedeId: string;
  sedeNombre: string;
  docenteId: string;
}

describe("Coordinador — crear grupo", () => {
  const nombre = `E2E-Grupo-UI-${Date.now()}`;
  let sede: SedeInfo;

  before(() => {
    cy.task<SedeInfo>("e2e:primeraSedeYDocente").then((s) => {
      sede = s;
    });
  });

  after(() => {
    cy.task("e2e:borrarGrupoPorNombre", nombre.toUpperCase());
  });

  it("crea un grupo nuevo y aparece en el listado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/grupos/nuevo");
    cy.get("#nombre").type(nombre);
    cy.get("#sede_id").then(() => {
      cy.get("#sede_id").select(sede.sedeNombre);
    });
    cy.get("#semestre").clear().type("1");
    cy.get("#cantidad_estudiantes").clear().type("25");
    cy.contains("button", "Guardar").click();

    // La acción del servidor normaliza el nombre del grupo a mayúsculas.
    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard/grupos");
    cy.contains(nombre.toUpperCase(), { timeout: 10000 }).should("be.visible");
    cy.screenshot("11-grupo-creado", { capture: "viewport" });
  });
});
