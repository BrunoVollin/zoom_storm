/// <reference path="../support/commands.ts" />

describe("Cart creation and payment", () => {
  const visitCartWithExistingCart = () => {
    cy.visit("/cart", {
      onBeforeLoad(window) {
        window.localStorage.setItem("zoom-storm:cart-id", "cart-1");
      },
    });
    cy.wait("@getCart");
  };

  beforeEach(() => {
    cy.login();
    cy.stubApi();
    cy.stubPayment();
  });

  it("pays for an existing cart with a new card and reaches the order page", () => {
    visitCartWithExistingCart();
    cy.get("[data-testid=checkout-btn]").should("exist").and("be.disabled");

    cy.get("#cep").clear().type("01310-100");
    cy.get("[data-testid=estimate-shipping-btn]").click();
    cy.wait("@getShipping");
    cy.contains("Shipping to").should("be.visible");

    cy.get("[data-testid=checkout-btn]").should("not.be.disabled").click();
    cy.wait("@checkout");

    cy.location("pathname").should("eq", "/checkout/payment");
    cy.location("search").should("eq", "?orderId=order-1");

    cy.wait("@getOrder");
    cy.wait("@getSavedCards");

    cy.get("#cardNumber").type("4242424242424242");
    cy.get("#cardName").type("Test User");
    cy.get("#expiry").type("12/30");
    cy.get("#cvv").type("123");

    cy.get("[data-testid=payment-submit-btn]").click();
    cy.wait("@payOrder");

    cy.location("pathname").should("eq", "/orders/order-1");
    cy.get("h1").should("contain.text", "Order #order-1");
  });

  it("completes checkout with a saved card without asking for CVC", () => {
    cy.intercept("GET", "/api/cart/profile/cards", { fixture: "saved-cards.json" }).as(
      "getSavedCardsWithCard",
    );

    visitCartWithExistingCart();
    cy.get("#cep").clear().type("01310-100");
    cy.get("[data-testid=estimate-shipping-btn]").click();
    cy.wait("@getShipping");
    cy.get("[data-testid=checkout-btn]").should("not.be.disabled").click();
    cy.wait("@checkout");

    cy.location("pathname").should("eq", "/checkout/payment");
    cy.wait("@getOrder");
    cy.wait("@getSavedCardsWithCard");

    cy.get('[data-testid=saved-card-option][data-card-id="card-1"]').click();
    cy.get("[data-testid=saved-card-payment-form]")
      .should("be.visible")
      .within(() => {
        cy.get("#cvv").should("not.exist");
        cy.get("[data-testid=saved-card-installments]").select("2");
        cy.get("[data-testid=payment-submit-btn]").click();
      });

    cy.wait("@payOrder").its("request.body").should("deep.equal", { installments: 2 });
    cy.location("pathname").should("eq", "/orders/order-1");
    cy.get("h1").should("contain.text", "Order #order-1");
  });
});
