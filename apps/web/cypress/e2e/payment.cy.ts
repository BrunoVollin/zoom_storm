/// <reference path="../support/commands.ts" />

/**
 * E2E: Add a product to the cart → checkout with shipping → pay with a new
 * credit card.
 *
 * `ProductCard`'s "Add to cart" button is temporarily disabled on
 * the catalog/home pages (see commit "temporarily disable add-to-cart
 * button on product card") and the product detail page fetches server-side
 * (so it can't be stubbed with `cy.intercept`, which only sees browser
 * requests). The wishlist page's `WishlistItemCard` still renders a live,
 * client-side `AddToCartButton`, so this spec favorites a product first and
 * adds it to the cart from there — the only add-to-cart control that is
 * both real and stubbable today.
 */

describe("Cart creation and payment", () => {
  beforeEach(() => {
    cy.login();
    cy.stubApi();
    cy.stubPayment();
    cy.intercept("GET", "/api/cart/wishlist", { fixture: "wishlist.json" }).as("getWishlist");

    // No cart exists yet for this user.
    cy.window().then((win) => win.localStorage.removeItem("zoom-storm:cart-id"));
  });

  it("adds a product to the cart, pays with a new card, and reaches the order page", () => {
    cy.visit("/account/wishlist");
    cy.wait("@getWishlist");

    cy.get("[data-testid=add-to-cart-btn]").first().click();
    cy.wait("@createCart");
    cy.wait("@addItem");

    cy.visit("/cart");
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
});
