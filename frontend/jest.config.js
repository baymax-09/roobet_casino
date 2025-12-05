module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/config/jest/shim.js'],
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['<rootDir>/config/jest/setupTests.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  coverageReporters: ['json-summary', 'lcov'],
  reporters: ['<rootDir>/test/jest/reporter.js'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/src/app',
    '<rootDir>/src/vendors',
    '<rootDir>/src/common',
    '<rootDir>/assets',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/config/jest/assetsTransformer.js',
    '\\.(css|less)$': '<rootDir>/config/jest/assetsTransformer.js',
    '\\.(scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
  },
  testMatch: ['**/?(*.)(spec|test).ts?(x)'],
  transform: {
    '^.+\\.([t|j]sx?)$': 'babel-jest',
  },
}
