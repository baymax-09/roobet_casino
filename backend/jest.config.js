/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  extensionsToTreatAsEsm: ['.ts'],
  coverageReporters: ['json-summary', 'lcov'],
  reporters: ['<rootDir>/test/jest/reporter.js'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', {
      // remove isolatedModules: true when we have 100% type coverage
      isolatedModules: true,
      useEsm: true,
      silent: true,
    }]
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['dotenv/config', '<rootDir>/test/jest/setupTests.js'],
  testRegex: '(/__tests__/.*|(\\.)(test|spec))\\.[jt]sx?$',
  runner: "groups",
}
