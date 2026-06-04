// tests/setup.js
// Shared helpers used by every test file:
//   - connect / clear / close  →  MongoDB memory-server lifecycle
//   - registerUser / loginUser →  shortcut to get a token pair in one call
//
// WHY mongodb-memory-server?
//   Tests need a real Mongoose connection (we want to verify DB writes),
//   but we don't want to hit Atlas over the network — that's slow, flaky,
//   and would pollute your real data. The memory server spins up an actual
//   MongoDB process locally and tears it down after the suite.  No cleanup,
//   no network, no cost.

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');

let mongoServer;

/** Start an in-memory MongoDB instance and connect Mongoose to it. */
const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

/** Wipe every collection — called in beforeEach so each test starts clean. */
const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/** Drop the DB, close the connection, and stop the memory server. */
const close = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
};

/**
 * Register a user and return the full response body (includes accessToken
 * and refreshToken).  Optional override lets tests use different credentials.
 */
const registerUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };
  const res = await request(app)
    .post('/api/auth/register')
    .send({ ...defaults, ...overrides });
  return res.body; // { _id, name, email, accessToken, refreshToken }
};

module.exports = { connect, clear, close, registerUser };
