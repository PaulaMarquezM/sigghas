interface FixturePublicado {
  periodoId: string;
  horarioId: string;
  materiaId: string;
  grupoIds: string[];
  sesionId: string;
  espacioId: string;
  espacioLibreId: string;
}

// La migración 20260728143000_permitir_edicion_horarios_publicados.sql quitó
// los triggers que bloqueaban editar sesiones de un horario ya publicado
// (RN de negocio cambiada por el equipo): ahora el coordinador SÍ puede
// reasignar aulas en un horario publicado. Lo que sigue protegido es el
// horario en sí: no se puede volver a "Publicar" (ya está publicado) ni
// des-publicarlo desde este editor.
describe("Regla de negocio — un horario publicado sigue siendo editable en sus sesiones", () => {
  let fixture: FixturePublicado;

  before(() => {
    cy.task<FixturePublicado>("e2e:prepararHorarioPublicado").then((f) => {
      fixture = f;
    });
  });

  after(() => {
    cy.task("e2e:limpiarHorarioPublicado", fixture);
  });

  it("el editor permite reasignar aula pero no vuelve a ofrecer 'Publicar Horario'", () => {
    cy.login("coordinador");
    cy.visit(`/dashboard/editar/${fixture.horarioId}`);
    // El badge de estado se ve en mayúsculas por CSS (text-transform), pero
    // el texto real en el DOM es el valor crudo del enum: "publicado".
    cy.contains("publicado", { timeout: 15000 }).should("be.visible");
    // El select de aula de la sesión sigue existiendo y editable.
    cy.get(`select[data-cy="select-espacio-${fixture.sesionId}"]`).should("exist");
    // Un horario ya publicado no vuelve a ofrecer el botón de publicarlo.
    cy.contains("button", "Publicar Horario").should("not.exist");
    cy.contains("Descargar PDF").should("be.visible");
    cy.screenshot("05-horario-publicado-editable", { capture: "viewport" });
  });
});
