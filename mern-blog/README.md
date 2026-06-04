# MERN Blog Platform

A full-stack blog platform where users can register, write posts, like, and comment — built with the **MERN stack** (MongoDB, Express, React, Node.js).

A React frontend talks to a Node/Express API over HTTP, with JWT authentication, protected routes, and per-user data ownership throughout.

---

## ✨ Features

- 🔐 **User authentication** — register & login with hashed passwords (bcrypt)
- 🔁 **Refresh-token auth** — short-lived access tokens + revocable refresh tokens with rotation
- 🤫 **Silent token refresh** — an Axios interceptor renews expired tokens and retries the request, so users never get logged out mid-action
- 📝 **Post CRUD** — create, read, update, delete; only the author can edit/delete
- ❤️ **Likes** — toggle like/unlike, with per-user "liked" state
- 💬 **Comments** — add and delete comments (author-only delete)
- 🏷️ **Tags & search** — filter by tag, full-text search, pagination & sorting
- 👁️ **Optional auth** — public routes still return per-user state (e.g. "have I liked this?") when a token is present
- 🧱 **Clean, layered architecture** (routes → controllers → models)

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| MongoDB + Mongoose | Database + object modeling |
| Express | Backend web framework / routing |
| React | Component-based frontend UI |
| Node.js | JavaScript runtime |
| Vite | Frontend build tool + dev server with API proxy |
| Axios | HTTP client with request/response interceptors |
| React Router | Client-side routing + protected routes |
| jsonwebtoken + bcryptjs | JWT auth + password hashing |
| express-validator | Request validation |

---

## 📁 Project Structure

```
mern-blog/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # MongoDB connection (Google DNS for Atlas SRV)
│   │   ├── models/                 # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Post.js             # title, content, author, likes[], tags[]
│   │   │   ├── Comment.js
│   │   │   └── RefreshToken.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # protect + optionalAuth
│   │   │   └── errorHandler.js
│   │   ├── controllers/            # authController, postController, commentController
│   │   ├── routes/                 # authRoutes, postRoutes, commentRoutes
│   │   ├── utils/generateToken.js
│   │   └── app.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/                     # axios.js (interceptors) + posts.js (API calls)
    │   ├── context/AuthContext.jsx  # global auth state (useReducer)
    │   ├── components/              # Navbar, PostCard, ProtectedRoute, Spinner
    │   ├── pages/                   # Home, PostDetail, CreatePost, EditPost, Login, Register
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js               # proxies /api → backend
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- A **MongoDB Atlas** connection string (free tier) — create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas/database)

### 2. Configure the backend environment
```bash
cd mern-blog/backend
cp .env.example .env
```
```ini
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mern-blog?retryWrites=true&w=majority
JWT_SECRET=your_long_random_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_different_long_random_secret
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
> ⚠️ This project **requires a MongoDB Atlas connection string** in `.env`. The real `.env` file is git-ignored — never commit it.

### 3. Run the app (two terminals)
```bash
# Terminal 1 — backend
cd mern-blog/backend
npm install
npm run dev                 # http://localhost:5000

# Terminal 2 — frontend
cd mern-blog/frontend
npm install
npm run dev                 # http://localhost:5173
```

Open <http://localhost:5173>, register an account, and start posting.

> The Vite dev server proxies all `/api` requests to the backend on port 5000 — so there are no CORS issues and no hardcoded backend URL in the frontend code.

---

## 📡 API Endpoints

Base URL: `http://localhost:5000`

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register, returns a token pair |
| POST | `/api/auth/login` | Public | Log in, returns `{ accessToken, refreshToken }` |
| POST | `/api/auth/refresh` | Public* | Exchange a refresh token for a new pair (rotates) |
| POST | `/api/auth/logout` | Public* | Revoke a refresh token |
| GET | `/api/auth/me` | Private | Get the logged-in user's profile |

### Posts
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/posts` | Public† | List posts (`?search`, `?tag`, `?page`, `?limit`, `?sort`) |
| GET | `/api/posts/:id` | Public† | Get a single post |
| POST | `/api/posts` | Private | Create a post |
| PUT | `/api/posts/:id` | Private | Update a post (author only) |
| DELETE | `/api/posts/:id` | Private | Delete a post + its comments (author only) |
| PUT | `/api/posts/:id/like` | Private | Toggle like/unlike |

### Comments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/posts/:postId/comments` | Public | List comments for a post |
| POST | `/api/posts/:postId/comments` | Private | Add a comment |
| DELETE | `/api/comments/:id` | Private | Delete a comment (author only) |

\* Require a valid **refresh token** in the body. † Use `optionalAuth` — a token is optional, but if present the response includes a per-user `liked` flag.

---

## 🔗 How the Frontend Connects to the Backend

1. **Vite proxy** forwards `/api/*` from the React dev server (port 5173) to Express (port 5000) — no CORS config, no hardcoded URLs.
2. **Axios request interceptor** attaches the JWT access token to every request automatically.
3. **Axios response interceptor** catches `401` errors, silently calls `/api/auth/refresh`, stores the new token pair, and retries the original request — the user never sees a logout.
4. **AuthContext** (`useReducer`) holds global auth state so any component can read the current user or trigger login/logout without prop-drilling.
5. **ProtectedRoute** redirects unauthenticated users to `/login`, preserving the page they tried to reach.

---

## 📝 What I Learned

- Connecting a React frontend to a Node/Express backend across the full request lifecycle
- Implementing **silent token refresh** with Axios interceptors and a request queue
- Managing global auth state with React Context + `useReducer`
- Modeling relationships in Mongoose (posts ↔ authors ↔ comments) and using `.populate()`
- The `optionalAuth` pattern — public content that still carries per-user state
- Enforcing ownership on the server (only authors can edit/delete their own content)
- Using a Vite proxy to avoid CORS and keep the frontend environment-agnostic

---

## 📄 License

MIT — part of my full-stack portfolio (Phase 3).
