import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const REAL_SPEC_DIRECTORY = fileURLToPath(new URL("../e2e/real", import.meta.url));

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? listTypeScriptFiles(path)
      : extname(entry.name) === ".ts"
        ? [path]
        : [];
  });
}

function isCyCommand(node: ts.CallExpression, command: string): boolean {
  if (!ts.isPropertyAccessExpression(node.expression)) return false;
  return (
    node.expression.name.text === command &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "cy"
  );
}

function isString(node: ts.Expression): boolean {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function location(source: ts.SourceFile, node: ts.Node): string {
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  return `${source.fileName}:${position.line + 1}:${position.character + 1}`;
}

function findForbiddenNetworkStubs(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const errors: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isCyCommand(node, "fixture")) {
      errors.push(`${location(source, node)} uses cy.fixture()`);
    }

    if (ts.isCallExpression(node) && isCyCommand(node, "intercept")) {
      const args = node.arguments;
      const isMethodAndUrlSpy = args.length === 2 && isString(args[0]!) && isString(args[1]!);
      const isMatcherOnlySpy = args.length === 1;

      if (!isMatcherOnlySpy && !isMethodAndUrlSpy) {
        errors.push(`${location(source, node)} registers a response stub with cy.intercept()`);
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "reply"
    ) {
      errors.push(`${location(source, node)} calls reply() from a route handler`);
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return errors;
}

export function assertRealSpecsDoNotStubNetwork(directory = REAL_SPEC_DIRECTORY): void {
  const errors = listTypeScriptFiles(directory).flatMap(findForbiddenNetworkStubs);
  if (errors.length === 0) return;

  throw new Error(
    [
      "Real Cypress specs must call the live application without response stubs:",
      ...errors.map((error) => `- ${error}`),
    ].join("\n"),
  );
}
