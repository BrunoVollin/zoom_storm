/// <reference path="../support/commands.ts" />

/**
 * E2E: Login state, authenticated state, and logout.
 *
 * Mirrors the stubbing patterns from `checkout.cy.ts` — `cy.login()` stubs
 * `/api/auth/me`, `cy.stubApi()` stubs the rest of the read paths the
 * header/home page need to render without hitting a real backend.
 */

describe("Login state", () => {
  it("shows a login CTA and no authenticated user menu when signed out", () => {
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: {} }).as("getMe");
    cy.stubApi();

    cy.visit("/");
    cy.wait("@getMe");

    cy.get("[data-testid=login-btn]").should("be.visible");
    cy.get("[data-testid=user-menu-authenticated]").should("not.exist");
    cy.get("[data-testid=logout-btn]").should("not.exist");
  });

  it("shows the authenticated user menu after cy.login()", () => {
    cy.login();
    cy.stubApi();

    cy.visit("/");
    cy.wait("@getMe");

    cy.get("[data-testid=user-menu-authenticated]").should("be.visible").and("contain.text", "Test");
    cy.get("[data-testid=logout-btn]").should("be.visible");
    cy.get("[data-testid=login-btn]").should("not.exist");
  });
});

describe("Logout", () => {
  it("returns to the signed-out state after logging out", () => {
    cy.login();
    cy.stubApi();

    cy.visit("/");
    cy.wait("@getMe");
    cy.get("[data-testid=user-menu-authenticated]").should("be.visible");

    // Logout posts to the BFF and then does a full-page redirect to "/" —
    // re-stub `/api/auth/logout` and flip `/api/auth/me` to unauthenticated
    // so the reloaded page reflects the signed-out session.
    cy.intercept("POST", "/api/auth/logout*", { statusCode: 200, body: {} }).as("logout");
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: {} }).as("getMeAfterLogout");

    cy.get("[data-testid=logout-btn]").click();

    cy.wait("@logout");
    cy.wait("@getMeAfterLogout");

    cy.get("[data-testid=login-btn]").should("be.visible");
    cy.get("[data-testid=user-menu-authenticated]").should("not.exist");
  });
});
