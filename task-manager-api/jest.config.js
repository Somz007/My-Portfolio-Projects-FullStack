// jest.config.js
// Configures Jest for this Node.js/Express project.
module.exports = {
  testEnvironment: 'node',

  // Only look for test files inside the tests/ folder.
  testMatch: ['**/tests/**/*.test.js'],

  // Run this file BEFORE each test suite to set up process.env.
  // Using "setupFiles" (not setupFilesAfterFramework) so env vars are
  // available when modules are first require()'d.
  setupFiles: ['./tests/env.js'],

  // Generous timeout: memory-server startup + Atlas latency headroom.
  testTimeout: 20000,

  // Print each test name as it runs — easier to spot which test failed.
  verbose: true,

  // Coverage config (only used when running `npm run test:coverage`).
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
};
