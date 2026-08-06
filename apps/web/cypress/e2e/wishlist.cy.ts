/// <reference path="../support/commands.ts" />

/**
 * E2E: Favorites (wishlist) — add a product from the catalog, see it listed
 * on the wishlist page, then remove it.
 *
 * `/search` is used as the catalog page instead of `/` because the home
 * page is mid-refactor by another agent; `/search` renders `ProductGrid` /
 * `ProductCard` client-side (via `useProducts`), which is where the
 * wishlist heart icon lives.
 */

describe("Favorites", () => {
  beforeEach(() => {
    cy.login();
    cy.stubApi();
  });

  it("adds a product to the wishlist from the catalog", () => {
    cy.intercept("GET", "/api/cart/wishlist", { fixture: "wishlist-empty.json" }).as("getWishlist");
    cy.intercept("POST", "/api/cart/wishlist", { fixture: "wishlist-item.json" }).as(
      "addToWishlist",
    );

    cy.visit("/search");
    cy.wait("@getProducts");

    cy.get("[data-testid=wishlist-toggle-btn]").first().should("have.attr", "data-wishlisted", "false");
    cy.get("[data-testid=wishlist-toggle-btn]").first().click();

    cy.wait("@addToWishlist").its("request.body").should("deep.equal", { productId: "product-1" });
  });

  it("adds a product to the wishlist against the real cart-service backend", () => {
    // Deliberately no cy.intercept stub/fixture for GET or POST
    // /api/cart/wishlist here — this is a regression check for the
    // "favoriting a product does nothing, POST /api/cart/wishlist returns
    // 422" production bug, so the request must hit the real cart-service.
    // cy.intercept without a stub response still creates a spy alias we can
    // assert on.
    cy.intercept("POST", "/api/cart/wishlist").as("addToWishlistReal");

    cy.visit("/search");

    cy.get("[data-testid=wishlist-toggle-btn]", { timeout: 20000 })
      .first()
      .should("have.attr", "data-wishlisted", "false");
    cy.get("[data-testid=wishlist-toggle-btn]").first().click();

    cy.wait("@addToWishlistReal").then((interception) => {
      // Log the full response so a failure here shows the real cart-service
      // error (status + body) instead of just a status-code mismatch.
      cy.log(
        `POST /api/cart/wishlist -> ${interception.response?.statusCode} ${JSON.stringify(
          interception.response?.body,
        )}`,
      );
    });
    cy.get("@addToWishlistReal").its("response.statusCode").should("equal", 201);

    cy.get("[data-testid=wishlist-toggle-btn]").first().should("have.attr", "data-wishlisted", "true");
  });

  it("shows the favorited product on the wishlist page", () => {
    cy.intercept("GET", "/api/cart/wishlist", { fixture: "wishlist.json" }).as("getWishlist");

    cy.visit("/account/wishlist");
    cy.wait("@getWishlist");

    cy.get("h1").should("contain.text", "Wishlist");
    cy.contains("The Legend of Zelda").should("be.visible");
    cy.get("[data-testid=wishlist-remove-btn]").should("be.visible");
  });

  it("removes a product from the wishlist", () => {
    cy.intercept("GET", "/api/cart/wishlist", { fixture: "wishlist.json" }).as("getWishlist");
    cy.intercept("DELETE", "/api/cart/wishlist/*", { statusCode: 204 }).as("removeFromWishlist");

    cy.visit("/account/wishlist");
    cy.wait("@getWishlist");
    cy.contains("The Legend of Zelda").should("be.visible");

    // After the DELETE resolves, the wishlist query is invalidated and
    // refetched — return the empty list on the next GET so the page
    // reflects the removal.
    cy.intercept("GET", "/api/cart/wishlist", { fixture: "wishlist-empty.json" }).as(
      "getWishlistAfterRemove",
    );

    cy.get("[data-testid=wishlist-remove-btn]").click();

    cy.wait("@removeFromWishlist");
    cy.wait("@getWishlistAfterRemove");

    cy.contains("Your wishlist is empty").should("be.visible");
  });
});
