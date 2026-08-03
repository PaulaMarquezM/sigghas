interface SedeInfo {
  sedeId: string;
  sedeNombre: string;
  docenteId: string;
}

describe("Coordinador — crear espacio", () => {
  // El campo del form es "numero" (solo dígitos/letras/guiones); el nombre
  // final lo arma el servidor como `${prefijo del tipo} ${numero}`, ej. "Aula
  // E2E-9999999".
  const numero = `E2E-${Date.now()}`;
  const nombreEsperado = `Aula ${numero}`;
  let sede: SedeInfo;

  before(() => {
    cy.task<SedeInfo>("e2e:primeraSedeYDocente").then((s) => {
      sede = s;
    });
  });

  after(() => {
    cy.task("e2e:borrarEspacioPorNombre", nombreEsperado);
  });

  it("crea un espacio (aula) nuevo y aparece en el listado", () => {
    cy.login("coordinador");
    cy.visit("/dashboard/espacios/nuevo");
    cy.get("#numero").type(numero);
    cy.get("#tipo").select("aula");
    cy.get("#capacidad").clear().type("35");
    cy.get("#sede_id").then(() => {
      cy.get("#sede_id").select(sede.sedeNombre);
    });
    cy.contains("button", "Guardar").click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard/espacios");
    cy.contains(nombreEsperado, { timeout: 10000 }).should("be.visible");
    cy.screenshot("12-espacio-creado", { capture: "viewport" });
  });
});
