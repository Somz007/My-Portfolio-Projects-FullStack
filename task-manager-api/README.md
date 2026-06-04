# Task Manager API

A RESTful API for managing personal tasks, with secure user authentication using JSON Web Tokens (JWT). Built with **Node.js**, **Express**, and **MongoDB**.

Each user can register, log in, and manage their own private list of tasks — full **CRUD** (Create, Read, Update, Delete) with input validation and clean error handling.

---

## ✨ Features

- 🔐 **User authentication** — register & login with hashed passwords (bcrypt)
- 🔁 **Refresh-token auth** — short-lived access tokens + revocable refresh tokens (real logout), with token rotation
- 🛡️ **Protected routes** — task endpoints require a valid access token
- 👤 **Per-user data isolation** — users can only access their own tasks
- ✅ **Full CRUD** for tasks
- 🔎 **Pagination, search, filtering & sorting** on the task list
- 🎯 **Input validation** with `express-validator` and clear error messages
- 🧱 **Clean, layered architecture** (routes → controllers → models)
- 📮 **Postman collection** included for easy testing

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| Node.js | JavaScript runtime |
| Express | Web framework / routing |
| MongoDB + Mongoose | Database + object modeling |
| jsonwebtoken | Signing & verifying JWTs |
| bcryptjs | Password hashing |
| express-validator | Request validation |
| dotenv | Environment variables |
| cors, morgan | Cross-origin support & request logging |

---

## 📁 Project Structure

```
task-manager-api/
├── src/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # Mongoose schemas (data shape + rules)
│   │   ├── User.js
│   │   └── Task.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verification ("protect")
│   │   └── errorHandler.js     # 404 + central error handling
│   ├── controllers/            # Business logic
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── routes/                 # URL → controller mapping + validation
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── utils/generateToken.js  # Signs JWTs
│   └── app.js                  # Express app (middleware + routes)
├── server.js                   # Entry point (loads env, connects DB, listens)
├── postman_collection.json     # Importable Postman tests
├── .env.example                # Config template
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- A MongoDB database. Either:
  - **Local:** install [MongoDB Community Server](https://www.mongodb.com/try/download/community), or
  - **Cloud (recommended, free):** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database)

### 2. Install dependencies
```bash
cd task-manager-api
npm install
```

### 3. Configure environment variables
Copy the template and fill in your values:
```bash
cp .env.example .env
```
```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task-manager   # or your Atlas connection string
JWT_SECRET=your_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_different_long_random_secret
JWT_REFRESH_EXPIRES_IN=7d
```
> ⚠️ Never commit your real `.env` file — it's already git-ignored.

### 4. Run the server
```bash
npm run dev     # development (auto-restarts on changes via nodemon)
npm start       # production
```
You should see:
```
✅ MongoDB connected: 127.0.0.1
🚀 Server running on http://localhost:5000
```

Verify it's alive: open <http://localhost:5000/api/health>.

---

## 📡 API Endpoints

Base URL: `http://localhost:5000`

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user, returns a token pair |
| POST | `/api/auth/login` | Public | Log in, returns `{ accessToken, refreshToken }` |
| POST | `/api/auth/refresh` | Public* | Exchange a refresh token for a new token pair (rotates) |
| POST | `/api/auth/logout` | Public* | Revoke a refresh token (ends the session) |
| GET | `/api/auth/me` | Private | Get the logged-in user's profile |

\* These require a valid **refresh token** in the body, not an access token.

### Tasks (all require `Authorization: Bearer <accessToken>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List your tasks (supports pagination/search/sort — see below) |
| GET | `/api/tasks/:id` | Get one task by id |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

#### Listing query parameters (all optional)
| Param | Example | Description |
|-------|---------|-------------|
| `status` | `?status=completed` | Filter by status |
| `search` | `?search=node` | Case-insensitive search in title + description |
| `sort` | `?sort=-createdAt` | Sort field; prefix `-` for descending (default `-createdAt`) |
| `page` | `?page=2` | Page number (default `1`) |
| `limit` | `?limit=10` | Items per page (default `10`, max `100`) |

Example: `GET /api/tasks?search=api&status=in-progress&page=1&limit=5&sort=dueDate`

Response shape:
```json
{
  "page": 1, "limit": 5, "total": 12, "totalPages": 3,
  "count": 5, "tasks": [ /* ... */ ]
}
```

### Task fields
| Field | Type | Notes |
|-------|------|-------|
| `title` | String | **required** |
| `description` | String | optional |
| `status` | String | `pending` \| `in-progress` \| `completed` (default `pending`) |
| `dueDate` | Date | optional, ISO format e.g. `2026-06-30` |
| `owner` | ObjectId | set automatically from the token |

---

## 🔑 How JWT Authentication Works Here

This API uses a **two-token (access + refresh)** strategy:

1. **Register / Login** → server verifies credentials and returns:
   - an **access token** (signed with `JWT_SECRET`, expires in ~15 min) — sent on every request
   - a **refresh token** (signed with a *different* `JWT_REFRESH_SECRET`, expires in ~7 days) — kept safe, used only to renew the access token
   A **hash** of the refresh token is stored in the database so it can be revoked.
2. **Client sends the access token** on protected requests:
   ```
   Authorization: Bearer <accessToken>
   ```
3. **Protected route** → the `protect` middleware verifies the access token's signature & expiry, looks up the user, and attaches it to `req.user`. Controllers scope every query to `req.user._id`, so users never see each other's tasks.
4. **When the access token expires** → the client calls `POST /api/auth/refresh` with its refresh token. The server verifies it, checks it hasn't been revoked (it's in the DB), then **rotates** it: the old refresh token is deleted and a fresh pair is issued.
5. **Logout** → `POST /api/auth/logout` deletes the refresh token's hash from the DB, so it can never mint another access token.

> **Why two tokens?** A long-lived token is convenient but dangerous if stolen, and a plain JWT can't be revoked (it's stateless). Splitting them gives the best of both: access tokens are useless within minutes if leaked, and refresh tokens are revocable because we track them server-side.

> The tokens are **signed, not encrypted** — their contents are readable by anyone, but they can't be forged without the secret. So we never put sensitive data in the payload.

---

## 🧪 Testing with Postman

1. Open Postman → **Import** → select `postman_collection.json`.
2. Run **Auth → Register** (or **Login**). The token is **auto-saved** to a collection variable by a test script.
3. Run any **Tasks** request — the saved token is sent automatically. **Create Task** also auto-saves the new task's id for the single-task requests.

### Example requests

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{ "name": "Jane Doe", "email": "jane@example.com", "password": "password123" }
```

**Create a task**
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "Learn Node.js", "description": "Build a REST API", "status": "in-progress", "dueDate": "2026-06-30" }
```

---

## 📝 Example Error Responses

Validation error (`400`):
```json
{ "errors": [ { "msg": "A valid email is required", "path": "email" } ] }
```

Missing/invalid token (`401`):
```json
{ "message": "Not authorized, no token provided" }
```

Not found (`404`):
```json
{ "message": "Task not found" }
```

---

## 🧪 Automated Tests (Jest + Supertest)

The test suite runs against an **in-memory MongoDB instance** (no network, no Atlas, no data pollution) and covers every endpoint.

```
tests/
  env.js          # sets process.env for the test runner
  setup.js        # MongoMemoryServer helpers + shared registerUser utility
  auth.test.js    # 26 tests covering register, login, refresh, logout, /me
  tasks.test.js   # 26 tests covering CRUD, pagination, search, sort, user isolation
```

```bash
npm test                 # run once
npm run test:watch       # watch mode (re-runs on save)
npm run test:coverage    # with coverage report
```

**What the tests verify:**
- Correct HTTP status codes and response shapes for every endpoint
- Input validation errors (missing fields, invalid enums, short passwords)
- JWT replay protection: a rotated refresh token is immediately rejected
- Token type isolation: a refresh token is rejected by the access-token protected routes (and vice versa)
- User data isolation: user B cannot read, update, or delete user A's tasks (returns 404, not 403 — we don't confirm resource existence to other users)
- Pagination metadata (`page`, `total`, `totalPages`) is accurate across all page/limit combinations
- Case-insensitive search matches in both `title` and `description`
- Combined search + status filters work together correctly

---

## 📦 What I Learned

- Structuring an Express app with separation of concerns
- Modeling data and relationships with Mongoose
- Hashing passwords with bcrypt and why we never store plain text
- Implementing a two-token JWT auth system (access + refresh) with real logout and token rotation
- Validating input and returning consistent, helpful error messages
- Building paginated, searchable, sortable list endpoints
- Writing automated API tests with Jest + Supertest against a MongoDB memory server
- Catching a subtle token-rotation security bug (duplicate tokens within the same second) with a test, and fixing it with a unique `jti` per token

---

## 📄 License

MIT — part of my full-stack portfolio (Phase 3).
