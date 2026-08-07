/// <reference path="../../support/commands.ts" />

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

    cy.get("[data-testid=user-menu-authenticated]")
      .should("be.visible")
      .and("contain.text", "Test");
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

describe("Authentication entry flows", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: {} });
    cy.intercept("GET", "/api/products/categories", { body: { categories: [] } });
  });

  it("starts email login through the identity provider", () => {
    cy.intercept("GET", "/api/auth/login", {
      headers: { "content-type": "text/html" },
      body: "<main><h1>Identity provider login</h1></main>",
    }).as("startLogin");

    cy.visit("/login");
    cy.get("[data-testid=login-page]").should("be.visible");
    cy.get("[data-testid=login-email-btn]").should("have.attr", "href", "/api/auth/login").click();

    cy.wait("@startLogin");
    cy.contains("Identity provider login").should("be.visible");
  });

  it("starts account creation through the identity provider", () => {
    cy.intercept("GET", "/api/auth/register", {
      headers: { "content-type": "text/html" },
      body: "<main><h1>Identity provider registration</h1></main>",
    }).as("startRegistration");

    cy.visit("/register");
    cy.get("[data-testid=register-page]").should("be.visible");
    cy.get("[data-testid=register-email-btn]")
      .should("have.attr", "href", "/api/auth/register")
      .click();

    cy.wait("@startRegistration");
    cy.contains("Identity provider registration").should("be.visible");
  });

  it("starts Google OAuth from the login page", () => {
    cy.intercept("GET", "/api/auth/google", {
      headers: { "content-type": "text/html" },
      body: "<main><h1>Google OAuth provider</h1></main>",
    }).as("startGoogleOAuth");

    cy.visit("/login");
    cy.get("[data-testid=login-google-btn]")
      .should("have.attr", "href", "/api/auth/google")
      .click();

    cy.wait("@startGoogleOAuth");
    cy.contains("Google OAuth provider").should("be.visible");
  });

  it("links login and registration entry pages in both directions", () => {
    cy.visit("/login");
    cy.get("[data-testid=login-switch-link]").click();
    cy.location("pathname").should("eq", "/register");

    cy.get("[data-testid=register-switch-link]").click();
    cy.location("pathname").should("eq", "/login");
  });
});
