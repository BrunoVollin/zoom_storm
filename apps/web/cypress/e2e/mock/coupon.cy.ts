/// <reference path="../../support/commands.ts" />

/**
 * E2E: Applying a coupon on the cart page — valid coupon discounts the
 * total, invalid coupon shows an error and leaves the total untouched.
 */

describe("Coupons", () => {
  beforeEach(() => {
    cy.login();
    cy.stubApi();

    cy.visit("/");
    cy.window().then((win) => win.localStorage.setItem("zoom-storm:cart-id", "cart-1"));
    cy.visit("/cart");

    cy.get("[data-testid=coupon-input]").should("be.visible");
  });

  it("applies and removes a valid coupon while updating the total", () => {
    cy.intercept("POST", "/api/cart/carts/*/coupons", { fixture: "cart-with-coupon.json" }).as(
      "applyCoupon",
    );
    cy.intercept("DELETE", "/api/cart/carts/*/coupons/*", { fixture: "cart.json" }).as(
      "removeCoupon",
    );

    cy.get("[data-testid=coupon-input]").type("10OFF");
    cy.get("[data-testid=apply-coupon-btn]").click();

    cy.wait("@applyCoupon").its("request.body").should("deep.equal", { couponId: "10OFF" });

    cy.get("[data-testid=applied-coupon]").should("be.visible").and("contain.text", "10%");
    cy.get("[data-testid=coupon-error]").should("not.exist");

    cy.get("[data-testid=remove-coupon-btn]").click();

    cy.wait("@removeCoupon")
      .its("request.url")
      .should("match", /\/coupons\/coupon-1$/);
    cy.get("[data-testid=applied-coupon]").should("not.exist");
    cy.get("[data-testid=coupon-input]").should("be.visible");
  });

  it("shows an error for an invalid coupon and keeps the cart unchanged", () => {
    cy.intercept("POST", "/api/cart/carts/*/coupons", {
      statusCode: 400,
      body: { status: "ERROR", message: "Cupom inválido ou expirado" },
    }).as("applyInvalidCoupon");

    cy.get("[data-testid=coupon-input]").type("INVALIDO");
    cy.get("[data-testid=apply-coupon-btn]").click();

    cy.wait("@applyInvalidCoupon");

    cy.get("[data-testid=coupon-error]").should("be.visible");
    cy.get("[data-testid=applied-coupon]").should("not.exist");
  });
});
