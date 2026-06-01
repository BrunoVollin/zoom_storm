const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
      },
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',

    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  testMatch: ['**/*.test.ts'],
};