/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
  // Mock @superset-ui/core for unit tests (not available in this package)
  moduleNameMapper: {
    '^@superset-ui/core$': '<rootDir>/test/__mocks__/@superset-ui/core.ts',
  },
};
