// tests/env.js
// Sets up process.env for the test environment BEFORE any module is loaded.
// This replaces the .env file for tests — we never want CI to depend on a
// local .env file, and we want secrets that are obviously test-only values.
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

// Use short, obviously-fake secrets. Separate secrets for access vs refresh
// mirrors the production setup and ensures our "wrong secret" edge cases work.
process.env.JWT_SECRET = 'test_access_secret_for_jest_runner_only';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_jest_runner_only';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
