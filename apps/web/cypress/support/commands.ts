/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /** Stubs the BFF `/auth/me` so the app sees an authenticated user. */
      login(): void;
      /** Stubs products, cart, shipping, and checkout API routes with fixture data. */
      stubApi(): void;
    }
  }
}

Cypress.Commands.add("login", () => {
  if (!Cypress.env("mockApi")) {
    cy.session(
      "authenticated-user",
      () => {
        cy.visit("/api/auth/login");

        cy.get("#username").type(Cypress.env("testUser"));
        cy.get("#password").type(Cypress.env("testPassword"));
        cy.get("#kc-login").click();

        cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
      },
      { cacheAcrossSpecs: true },
    );
    return;
  }

  cy.intercept("GET", "/api/auth/me", { fixture: "user.json" }).as("getMe");
});

Cypress.Commands.add("stubApi", () => {
  if (!Cypress.env("mockApi")) return;

  cy.intercept("GET", "/api/products/products*", { fixture: "products.json" }).as("getProducts");
  cy.intercept("GET", "/api/cart/carts/*", { fixture: "cart.json" }).as("getCart");
  cy.intercept("POST", "/api/cart/carts", { fixture: "cart.json" }).as("createCart");
  cy.intercept("POST", "/api/cart/carts/*/items", { fixture: "cart.json" }).as("addItem");
  cy.intercept("GET", "/api/cart/carts/*/shipping*", { fixture: "shipping.json" }).as("getShipping");
  cy.intercept("POST", "/api/cart/carts/*/checkout", { fixture: "cart-empty.json" }).as("checkout");
});

export {};
