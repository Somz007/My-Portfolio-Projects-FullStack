// tests/tasks.test.js
// Tests for every task endpoint:
//   POST   /api/tasks           create
//   GET    /api/tasks           list (+ pagination, search, sort, status filter)
//   GET    /api/tasks/:id       get single
//   PUT    /api/tasks/:id       update
//   DELETE /api/tasks/:id       delete
//
// A second user ("userB") is used to verify that users can never read
// or modify each other's tasks — a critical security property.

const request = require('supertest');
const app = require('../src/app');
const { connect, clear, close, registerUser } = require('./setup');

beforeAll(connect);
afterAll(close);
beforeEach(clear);

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Register a user and return { token, userId }. */
const setup = async (overrides = {}) => {
  const body = await registerUser(overrides);
  return { token: body.accessToken, userId: body._id };
};

/** Create a task for a given user token and return the response body. */
const createTask = async (token, fields = {}) => {
  const defaults = {
    title: 'Default Task',
    description: 'A description',
    status: 'pending',
  };
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...defaults, ...fields });
  return res.body;
};

// ─────────────────────────────────────────────────────────────
//  POST /api/tasks — create
// ─────────────────────────────────────────────────────────────
describe('POST /api/tasks', () => {
  it('creates a task and returns 201 with the task document', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Learn Jest', description: 'Write proper tests', status: 'in-progress', dueDate: '2026-12-31' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Learn Jest');
    expect(res.body.status).toBe('in-progress');
    expect(res.body).toHaveProperty('owner');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('stamps the task with the correct owner id', async () => {
    const { token, userId } = await setup();
    const task = await createTask(token);
    expect(task.owner).toBe(userId);
  });

  it('defaults status to "pending" when omitted', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Minimal task' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('returns 400 when title is missing', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No title here' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/title/i);
  });

  it('returns 400 for an invalid status value', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad status', status: 'unknown-status' });

    expect(res.status).toBe(400);
  });

  it('returns 401 when no access token is provided', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'No auth' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
//  GET /api/tasks — list, pagination, search, sort, isolation
// ─────────────────────────────────────────────────────────────
describe('GET /api/tasks', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await setup());
    // Seed 5 tasks for the main user.
    await createTask(token, { title: 'Alpha task', status: 'pending' });
    await createTask(token, { title: 'Beta task', description: 'mentions node', status: 'in-progress' });
    await createTask(token, { title: 'Gamma task', status: 'completed' });
    await createTask(token, { title: 'Delta node task', status: 'pending' });
    await createTask(token, { title: 'Epsilon task', status: 'pending' });
  });

  it('returns all tasks for the logged-in user with pagination metadata', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it('paginates correctly: limit=2, page=1 returns 2 items', async () => {
    const res = await request(app)
      .get('/api/tasks?limit=2&page=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3); // ceil(5/2) = 3
    expect(res.body.page).toBe(1);
  });

  it('paginates correctly: limit=2, page=2 returns the next 2 items', async () => {
    const res = await request(app)
      .get('/api/tasks?limit=2&page=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.count).toBe(2);
    expect(res.body.page).toBe(2);
  });

  it('paginates correctly: last page returns remaining items', async () => {
    const res = await request(app)
      .get('/api/tasks?limit=2&page=3')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.count).toBe(1); // 5 tasks, page 3 of 2-per-page has 1 left
    expect(res.body.totalPages).toBe(3);
  });

  it('clamps limit to maximum of 100', async () => {
    const res = await request(app)
      .get('/api/tasks?limit=999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(100);
  });

  it('filters by status correctly', async () => {
    const res = await request(app)
      .get('/api/tasks?status=pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3); // Alpha, Delta, Epsilon are pending
    res.body.tasks.forEach((t) => expect(t.status).toBe('pending'));
  });

  it('searches title and description case-insensitively', async () => {
    // "node" appears in "Delta node task" (title) and "mentions node" (description)
    const res = await request(app)
      .get('/api/tasks?search=NODE')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it('combines search and status filters', async () => {
    // Only "Delta node task" is both pending AND matches "node"
    const res = await request(app)
      .get('/api/tasks?search=node&status=pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.total).toBe(1);
    expect(res.body.tasks[0].title).toBe('Delta node task');
  });

  it('sorts ascending by title when sort=title', async () => {
    const res = await request(app)
      .get('/api/tasks?sort=title')
      .set('Authorization', `Bearer ${token}`);

    const titles = res.body.tasks.map((t) => t.title);
    const sorted = [...titles].sort();
    expect(titles).toEqual(sorted);
  });

  it('sorts descending when sort field is prefixed with -', async () => {
    const res = await request(app)
      .get('/api/tasks?sort=-title')
      .set('Authorization', `Bearer ${token}`);

    const titles = res.body.tasks.map((t) => t.title);
    const sorted = [...titles].sort().reverse();
    expect(titles).toEqual(sorted);
  });

  it('returns an empty list (not an error) when search has no matches', async () => {
    const res = await request(app)
      .get('/api/tasks?search=zzznomatch')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.tasks).toHaveLength(0);
  });

  it('user isolation: a second user sees only their own tasks', async () => {
    // Register a second user with their own task.
    const { token: tokenB } = await setup({ email: 'userb@example.com' });
    await createTask(tokenB, { title: 'User B task' });

    // User A should still only see their 5 tasks.
    const resA = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(resA.body.total).toBe(5);

    // User B should only see their 1 task.
    const resB = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resB.body.total).toBe(1);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
//  GET /api/tasks/:id — get single task
// ─────────────────────────────────────────────────────────────
describe('GET /api/tasks/:id', () => {
  it('returns 200 with the task document for the owner', async () => {
    const { token } = await setup();
    const task = await createTask(token, { title: 'My specific task' });

    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('My specific task');
  });

  it('returns 404 for a non-existent (but valid-format) id', async () => {
    const { token } = await setup();
    const fakeId = '000000000000000000000001';

    const res = await request(app)
      .get(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when user B requests user A\'s task', async () => {
    const { token: tokenA } = await setup({ email: 'usera@example.com' });
    const { token: tokenB } = await setup({ email: 'userb@example.com' });

    const taskA = await createTask(tokenA, { title: 'Private A task' });

    const res = await request(app)
      .get(`/api/tasks/${taskA._id}`)
      .set('Authorization', `Bearer ${tokenB}`); // B trying to access A's task

    expect(res.status).toBe(404); // not 403 — we don't confirm the task exists
  });

  it('returns 404 for a malformed id (handled by the CastError in errorHandler)', async () => {
    const { token } = await setup();

    const res = await request(app)
      .get('/api/tasks/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
//  PUT /api/tasks/:id — update
// ─────────────────────────────────────────────────────────────
describe('PUT /api/tasks/:id', () => {
  it('updates only the provided fields and returns the updated task', async () => {
    const { token } = await setup();
    const task = await createTask(token, { title: 'Original title', status: 'pending' });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.title).toBe('Original title'); // unchanged
  });

  it('returns 400 for an invalid status value', async () => {
    const { token } = await setup();
    const task = await createTask(token);

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'not-a-real-status' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when title is updated to an empty string', async () => {
    const { token } = await setup();
    const task = await createTask(token);

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when user B tries to update user A\'s task', async () => {
    const { token: tokenA } = await setup({ email: 'usera@example.com' });
    const { token: tokenB } = await setup({ email: 'userb@example.com' });
    const taskA = await createTask(tokenA);

    const res = await request(app)
      .put(`/api/tasks/${taskA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
//  DELETE /api/tasks/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/tasks/:id', () => {
  it('deletes the task and returns 200 with the deleted id', async () => {
    const { token } = await setup();
    const task = await createTask(token);

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(task._id);
  });

  it('task is gone after deletion (subsequent GET returns 404)', async () => {
    const { token } = await setup();
    const task = await createTask(token);

    await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);

    const get = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(404);
  });

  it('returns 404 when user B tries to delete user A\'s task', async () => {
    const { token: tokenA } = await setup({ email: 'usera@example.com' });
    const { token: tokenB } = await setup({ email: 'userb@example.com' });
    const taskA = await createTask(tokenA);

    const res = await request(app)
      .delete(`/api/tasks/${taskA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent id', async () => {
    const { token } = await setup();

    const res = await request(app)
      .delete('/api/tasks/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
