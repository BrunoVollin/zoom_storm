import { defineConfig } from "cypress";

import { assertRealSpecsDoNotStubNetwork } from "./cypress/support/verify-real-specs";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3100",
    specPattern: "cypress/e2e/real/**/*.cy.ts",
    supportFile: "cypress/support/real.ts",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 20000,
    // A real integration failure must remain visible instead of being hidden
    // by an automatic rerun. Flakiness is diagnosed through logs/artifacts.
    retries: 0,
    setupNodeEvents(_on, config) {
      assertRealSpecsDoNotStubNetwork();
      return config;
    },
    env: {
      keycloakUrl: "http://localhost:3040",
      keycloakRealm: "zoom-storm",
      testUser: "test",
      testPassword: "test123",
      mockApi: false,
    },
  },
});
