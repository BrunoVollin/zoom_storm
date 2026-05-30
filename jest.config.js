/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      useESM: false,
      tsconfig: {
        module: "commonjs",
        esModuleInterop: true,
      },
    },
  },
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": "ts-jest",
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)",
  ],
  testMatch: ["**/*.test.ts"],
};