/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /** Stubs the BFF `/auth/me` so the app sees an authenticated user. */
      login(): void;
      /** Stubs products, cart, shipping, and checkout API routes with fixture data. */
      stubApi(): void;
      /** Stubs the wishlist (favorites) API routes with fixture data. */
      stubWishlist(): void;
      /** Stubs saved cards + order fetch/pay API routes for the payment flow. */
      stubPayment(): void;
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

  // Product list first, individual-product and categories routes registered
  // after so they take priority for their more specific URLs (Cypress uses
  // the most-recently-registered matching intercept).
  cy.intercept("GET", "/api/products*", { fixture: "products.json" }).as("getProducts");
  cy.intercept("GET", "/api/products/*", { fixture: "product-detail.json" }).as("getProductById");
  cy.intercept("GET", "/api/flash-offers/active*", { body: { offers: [] } }).as(
    "getActiveFlashOffers",
  );

  cy.intercept("GET", "/api/cart/carts/*", { fixture: "cart.json" }).as("getCart");
  cy.intercept("POST", "/api/cart/carts", { fixture: "cart.json" }).as("createCart");
  cy.intercept("POST", "/api/cart/carts/*/items", { fixture: "cart.json" }).as("addItem");
  cy.intercept("GET", "/api/cart/carts/*/shipping*", { fixture: "shipping.json" }).as(
    "getShipping",
  );
  cy.intercept("POST", "/api/cart/carts/*/checkout", { fixture: "checkout.json" }).as("checkout");
});

Cypress.Commands.add("stubWishlist", () => {
  if (!Cypress.env("mockApi")) return;

  cy.intercept("GET", "/api/cart/wishlist", { fixture: "wishlist-empty.json" }).as("getWishlist");
  cy.intercept("POST", "/api/cart/wishlist", { fixture: "wishlist-item.json" }).as("addToWishlist");
  cy.intercept("DELETE", "/api/cart/wishlist/*", { status: "SUCCESS" }).as("removeFromWishlist");
});

Cypress.Commands.add("stubPayment", () => {
  if (!Cypress.env("mockApi")) return;

  cy.intercept("GET", "/api/cart/profile/cards", { fixture: "saved-cards-empty.json" }).as(
    "getSavedCards",
  );
  cy.intercept("POST", "/api/cart/profile/cards", { fixture: "saved-cards-empty.json" }).as(
    "addSavedCard",
  );
  cy.intercept("GET", "/api/cart/orders/*", { fixture: "order.json" }).as("getOrder");
  cy.intercept("POST", "/api/cart/orders/*/pay", { fixture: "order-paid.json" }).as("payOrder");
});

export {};
