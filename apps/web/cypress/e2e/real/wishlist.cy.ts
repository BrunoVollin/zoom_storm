/// <reference path="../../support/commands.ts" />

describe("Favorites against the integrated backend", () => {
  beforeEach(() => {
    cy.login();
  });

  it("persists a product in the authenticated user's wishlist", () => {
    cy.visit("/search");

    cy.get("[data-testid=wishlist-toggle-btn]", { timeout: 20000 })
      .first()
      .then(($button) => {
        // The integrated database may preserve state between local runs.
        // Normalize through the UI without bypassing the backend.
        if ($button.attr("data-wishlisted") === "true") {
          cy.wrap($button).click().should("have.attr", "data-wishlisted", "false");
        }
      });

    // This intercept is a spy only. cypress.real.config.ts rejects response
    // bodies and route handlers in every real spec before the run starts.
    cy.intercept("POST", "/api/cart/wishlist").as("addToWishlist");
    cy.get("[data-testid=wishlist-toggle-btn]")
      .first()
      .should("have.attr", "data-wishlisted", "false")
      .click();

    cy.wait("@addToWishlist").then((interception) => {
      cy.log(
        `POST /api/cart/wishlist -> ${interception.response?.statusCode} ${JSON.stringify(
          interception.response?.body,
        )}`,
      );
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.get("[data-testid=wishlist-toggle-btn]")
      .first()
      .should("have.attr", "data-wishlisted", "true");
  });
});
