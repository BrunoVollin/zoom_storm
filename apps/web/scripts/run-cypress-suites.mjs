import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cypressBinary = fileURLToPath(new URL("../node_modules/.bin/cypress", import.meta.url));
const forwardedArguments = process.argv.slice(2);
const suites = [
  ["real", "cypress.real.config.ts"],
  ["mock", "cypress.mock.config.ts"],
];

const failures = [];

for (const [name, configFile] of suites) {
  process.stdout.write(`\n[cypress:${name}] Starting ${name} suite\n`);
  const result = spawnSync(
    cypressBinary,
    ["run", "--config-file", configFile, ...forwardedArguments],
    { stdio: "inherit" },
  );

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    failures.push(`${name} (exit ${exitCode})`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`\nCypress suites failed: ${failures.join(", ")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("\nAll Cypress suites passed.\n");
}
