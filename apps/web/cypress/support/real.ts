import "./commands";

if (Cypress.env("mockApi")) {
  throw new Error("The real Cypress support file requires mockApi=false.");
}
