/// <reference types="cypress" />

// Cuentas creadas por scripts/seed.mjs (ver cypress/support/tasks.ts).
const CREDENCIALES = {
  coordinador: { email: "coordinador@sigghas.test", password: "Sigghas2026!", label: "Coordinador" },
  docente: { email: "docente.tc@sigghas.test", password: "Sigghas2026!", label: "Docente" },
  estudiante: { email: "estudiante1@sigghas.test", password: "Sigghas2026!", label: "Estudiante" },
} as const;

type Rol = keyof typeof CREDENCIALES;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(rol: Rol): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (rol: Rol) => {
  const { email, password, label } = CREDENCIALES[rol];
  cy.visit("/login");
  cy.contains("button", label).click();
  cy.get("input#email").type(email);
  cy.get("input#password").type(password);
  cy.contains("button", "Iniciar sesión").click();
  cy.url({ timeout: 15000 }).should("include", "/dashboard");
});

export {};
