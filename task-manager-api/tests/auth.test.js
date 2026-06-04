// tests/auth.test.js
// Tests for every auth endpoint:
//   POST /api/auth/register
//   POST /api/auth/login
//   POST /api/auth/refresh  (including token rotation / replay protection)
//   POST /api/auth/logout   (real revocation)
//   GET  /api/auth/me       (protected route)

const request = require('supertest');
const app = require('../src/app');
const { connect, clear, close, registerUser } = require('./setup');

beforeAll(connect);
afterAll(close);
beforeEach(clear); // every test gets a clean, empty database

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with a token pair', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    // Must return both tokens
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    // Must return basic user info
    expect(res.body.email).toBe('jane@example.com');
    // Must NEVER return the password
    expect(res.body).not.toHaveProperty('password');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'jane@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/email/i);
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'abc',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/password/i);
  });

  it('returns 400 when email is already registered', async () => {
    await registerUser(); // first registration
    const res = await request(app).post('/api/auth/register').send({
      name: 'Another',
      email: 'test@example.com', // same email as registerUser default
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Seed a user for login tests.
    await registerUser();
  });

  it('returns 200 with a token pair on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).not.toHaveProperty('password');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    // Same message for wrong email and wrong password (don't reveal which)
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 401 for an unregistered email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  let refreshToken;
  let accessToken;

  beforeEach(async () => {
    const tokens = await registerUser();
    refreshToken = tokens.refreshToken;
    accessToken = tokens.accessToken;
  });

  it('returns a new token pair on a valid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('rotates the token: old refresh token is rejected after use', async () => {
    // Use the token once — a new pair is issued and the old one is deleted.
    await request(app).post('/api/auth/refresh').send({ refreshToken });

    // Sending the OLD token again must now fail.
    const replay = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(replay.status).toBe(401);
    expect(replay.body.message).toMatch(/revoked/i);
  });

  it('returns 401 for a syntactically invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'this.is.not.a.real.jwt' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when a refresh token is signed with the access-token secret', async () => {
    // An access token must NOT be accepted as a refresh token.
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: accessToken }); // wrong token type

    expect(res.status).toBe(401);
  });

  it('returns 401 when refreshToken is absent', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('returns 200 and the token cannot be used to refresh afterwards', async () => {
    const { refreshToken } = await registerUser();

    const logout = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });
    expect(logout.status).toBe(200);

    // The refresh token was revoked — it must now be rejected.
    const attempt = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(attempt.status).toBe(401);
  });

  it('is idempotent: logging out twice still returns 200', async () => {
    const { refreshToken } = await registerUser();

    await request(app).post('/api/auth/logout').send({ refreshToken });
    const second = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(second.status).toBe(200);
  });

  it('returns 200 even when no token is provided in the body', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────
//  GET /api/auth/me
// ─────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('returns the user profile for a valid access token', async () => {
    const { accessToken, email } = await registerUser();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body).not.toHaveProperty('password');
  });

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('returns 401 for a tampered or invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token failed/i);
  });

  it('returns 401 when a refresh token is sent in place of an access token', async () => {
    const { refreshToken } = await registerUser();

    // A refresh token is signed with a DIFFERENT secret than the one the
    // protect middleware uses — so it must be rejected as invalid.
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshToken}`);
    expect(res.status).toBe(401);
  });
});
