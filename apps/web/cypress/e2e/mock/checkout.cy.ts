/// <reference path="../../support/commands.ts" />

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

    cy.get("#cep").clear().type("01310-100");
    cy.get("[data-testid=estimate-shipping-btn]").click();

    cy.wait("@getShipping");
    cy.contains("Shipping to").should("be.visible");

    cy.get("[data-testid=checkout-btn]").should("not.be.disabled");

    cy.screenshot("checkout-frete-estimado", { capture: "fullPage" });
  });

  it("finalizes the purchase and moves on to payment", () => {
    cy.get("#cep").clear().type("01310-100");
    cy.get("[data-testid=estimate-shipping-btn]").click();
    cy.wait("@getShipping");
    cy.contains("Shipping to").should("be.visible");

    cy.get("[data-testid=checkout-btn]").click();

    cy.wait("@checkout");
    // Checkout creates an order and hands the user off to the payment page
    // instead of leaving them on the (now empty) cart.
    cy.location("pathname").should("eq", "/checkout/payment");

    cy.screenshot("checkout-finalizado", { capture: "fullPage" });
  });
});
