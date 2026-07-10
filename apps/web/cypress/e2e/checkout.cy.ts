/// <reference path="../support/commands.ts" />

/**
 * E2E: Login → Add product to cart → Checkout
 *
 * API calls are stubbed via cy.intercept() so tests are fast and don't depend
 * on live backend services. Each describe block sets up its own stubs in
 * beforeEach to keep tests independent and self-contained.
 */

describe("Authentication", () => {
  it("shows a login CTA when the user is not authenticated", () => {
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: {} });
    cy.stubApi();

    cy.visit("/");

    cy.contains("Entre para comprar").should("be.visible");
    cy.get("[data-testid=add-to-cart-btn]").should("not.exist");
  });

  it("shows the add-to-cart button after the user authenticates", () => {
    cy.login();
    cy.stubApi();

    cy.visit("/");

    cy.contains("Entre para comprar").should("not.exist");
    cy.get("[data-testid=add-to-cart-btn]").first().should("be.visible");
  });
});

describe("Add product to cart", () => {
  beforeEach(() => {
    cy.login();
    cy.stubApi();
    cy.visit("/");
    cy.get("[data-testid=add-to-cart-btn]").first().should("be.visible");
  });

  it("shows instant feedback after adding a product", () => {
    cy.get("[data-testid=add-to-cart-btn]").first().click();

    cy.get("[data-testid=add-to-cart-btn]").first().should("contain.text", "Adicionado!");
  });

  it("navigating to the cart shows the added product", () => {
    cy.get("[data-testid=add-to-cart-btn]").first().click();
    cy.contains("Adicionado!").should("be.visible");

    // Pre-seed the cart ID so the cart page loads the stubbed cart
    cy.window().then((win) => win.localStorage.setItem("zoom-storm:cart-id", "cart-1"));
    cy.visit("/cart");

    cy.get("h1").should("contain.text", "Seu carrinho");
    cy.contains("The Legend of Zelda").should("be.visible");
    cy.get("[data-testid=checkout-btn]").should("exist");
  });
});

describe("Checkout", () => {
  beforeEach(() => {
    cy.login();
    cy.stubApi();

    // Pre-seed localStorage so the cart page fetches the stubbed cart
    cy.visit("/");
    cy.window().then((win) => win.localStorage.setItem("zoom-storm:cart-id", "cart-1"));
    cy.visit("/cart");

    cy.get("[data-testid=checkout-btn]").should("exist");
  });

  it("checkout button is disabled until shipping is estimated", () => {
    cy.get("[data-testid=checkout-btn]").should("be.disabled");

    cy.get("#distance").clear().type("50");
    cy.get("form").find('[type="submit"]').click();

    cy.wait("@getShipping");
    cy.contains("Frete estimado").should("be.visible");

    cy.get("[data-testid=checkout-btn]").should("not.be.disabled");

    cy.screenshot("checkout-frete-estimado", { capture: "fullPage" });
  });

  it("finalizes the purchase and empties the cart", () => {
    cy.get("#distance").clear().type("50");
    cy.get("form").find('[type="submit"]').click();
    cy.wait("@getShipping");
    cy.contains("Frete estimado").should("be.visible");

    cy.get("[data-testid=checkout-btn]").click();

    cy.wait("@checkout");
    cy.contains("Seu carrinho está vazio").should("be.visible");

    cy.screenshot("checkout-finalizado", { capture: "fullPage" });
  });
});
