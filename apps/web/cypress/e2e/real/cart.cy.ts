/// <reference path="../../support/commands.ts" />

describe("Cart against the integrated backend", () => {
  beforeEach(() => {
    cy.login();
  });

  it("opens a product detail before adding its variant to the cart", () => {
    cy.intercept("POST", "/api/cart/carts").as("createCart");
    cy.intercept("POST", "/api/cart/carts/*/items").as("addItem");

    cy.visit("/search");
    cy.get('a[href^="/products/"]', { timeout: 20000 }).first().click();
    cy.location("pathname").should("match", /^\/products\/[^/]+$/);
    cy.get("[data-testid=add-to-cart-btn]").should("be.visible").click();

    cy.wait("@createCart").its("response.statusCode").should("be.oneOf", [200, 201]);
    cy.wait("@addItem").its("response.statusCode").should("be.oneOf", [200, 201]);
    cy.get("[data-testid=add-to-cart-btn]").should("contain.text", "Added!");
  });
});
