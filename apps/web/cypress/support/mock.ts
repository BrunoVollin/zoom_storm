import "./commands";

if (!Cypress.env("mockApi")) {
  throw new Error("The mocked Cypress support file requires mockApi=true.");
}
