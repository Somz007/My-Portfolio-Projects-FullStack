# Authentication System

A complete, production-style authentication system covering every security layer a real app needs: register, login, logout, email verification, password reset via email, account lockout, and rate limiting. Built with **Node.js**, **Express**, **JWT**, **bcrypt**, and **Nodemailer**.

A React frontend provides the full user journey — sign up, verify your email, log in, and reset a forgotten password — all backed by a hardened Express API.

## 🚀 Live Demo

**Frontend:** https://somz007.github.io/My-Portfolio-Projects-FullStack/auth-system/
**Backend API:** https://auth-system-backend-somz007.onrender.com

---

## ✨ Features

- 🔐 **Register & login** — passwords hashed with bcrypt (cost 12), strength rules enforced
- 🔁 **Refresh-token auth** — short-lived access tokens + revocable refresh tokens with rotation
- 📧 **Email verification** — a hashed, expiring token emailed on signup (Nodemailer)
- 🔑 **Password reset via email** — secure `crypto.randomBytes` token, hashed in the DB, 10-minute expiry, one-time use
- 🚫 **Account lockout** — 5 failed logins locks the account for 2 hours
- 🛡️ **Rate limiting** — 20 req/15 min on auth routes, 5 req/hr on password-reset routes
- 🕵️ **Account enumeration protection** — forgot-password always returns the same response
- 🔄 **Session invalidation** — resetting a password revokes all existing refresh tokens
- 🧪 **Dev-friendly email** — uses Ethereal in development; preview URL printed to the console

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| Node.js | JavaScript runtime |
| Express | Web framework / routing |
| MongoDB + Mongoose | Database + object modeling |
| jsonwebtoken | Access + refresh JWTs |
| bcryptjs | Password hashing |
| Nodemailer | Sending verification & reset emails |
| express-rate-limit | Brute-force / abuse protection |
| express-validator | Request validation |
| React + Vite | Frontend UI + dev server |

---

## 📁 Project Structure

```
auth-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js              # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js               # + verify/reset tokens, lockout fields
│   │   │   └── RefreshToken.js       # hashed tokens, TTL index
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification ("protect")
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js        # authLimiter + resetLimiter
│   │   ├── utils/
│   │   │   ├── email.js              # Nodemailer + Ethereal auto-setup
│   │   │   └── generateToken.js
│   │   ├── controllers/authController.js
│   │   ├── routes/authRoutes.js
│   │   └── app.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js              # interceptor w/ silent refresh
    │   ├── context/AuthContext.jsx
    │   ├── components/               # Navbar, ProtectedRoute
    │   ├── pages/                    # Login, Register, ForgotPassword,
    │   │                             #   ResetPassword, VerifyEmail, Dashboard
    │   └── App.jsx
    └── vite.config.js                # proxies /api → backend
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- A **MongoDB Atlas** connection string (free tier) — [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- **Email (Nodemailer) credentials** — *optional in development* (see note below)

### 2. Configure the backend environment
```bash
cd auth-system/backend
cp .env.example .env
```
```ini
PORT=5002
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/auth-system?retryWrites=true&w=majority
JWT_SECRET=your_long_random_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_different_long_random_secret
JWT_REFRESH_EXPIRES_IN=7d
RESET_TOKEN_EXPIRES_MIN=10
# Email (Nodemailer) — leave EMAIL_USER/PASS blank in dev to auto-create an Ethereal test inbox
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM="Auth System <noreply@authsystem.dev>"
CLIENT_URL=http://localhost:5174
```

> ⚠️ This project **requires a MongoDB Atlas connection string** in `.env`.
>
> 📧 It also uses **Nodemailer credentials**. In **development** you can leave `EMAIL_USER`/`EMAIL_PASS` blank — the server auto-creates a free [Ethereal](https://ethereal.email) test inbox and prints a clickable preview URL for every email (verification + reset). For **production**, set real SMTP credentials (e.g. Gmail App Password, SendGrid, Mailgun).

### 3. Run the app (two terminals)
```bash
# Terminal 1 — backend
cd auth-system/backend
npm install
npm run dev                 # http://localhost:5002

# Terminal 2 — frontend
cd auth-system/frontend
npm install
npm run dev                 # http://localhost:5174
```

Open <http://localhost:5174>, register, then check the **server console** for the Ethereal preview URL to see your verification email with the live link.

---

## 📡 API Endpoints

Base URL: `http://localhost:5002`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register, sends a verification email, returns tokens |
| POST | `/api/auth/login` | Public | Log in (enforces lockout after 5 failures) |
| POST | `/api/auth/refresh` | Public* | Rotate the token pair |
| POST | `/api/auth/logout` | Public* | Revoke a refresh token |
| GET | `/api/auth/me` | Private | Get the logged-in user's profile |
| POST | `/api/auth/forgot-password` | Public | Email a reset link (always returns 200) |
| POST | `/api/auth/reset-password` | Public | Reset password using the emailed token |
| POST | `/api/auth/verify-email` | Public | Verify an email using the emailed token |
| POST | `/api/auth/resend-verification` | Private | Resend the verification email |

\* Require a valid **refresh token** in the body.

---

## 🔒 How the Security Layers Work

- **Two-token JWT** — a 15-min access token (sent on every request) and a 7-day refresh token. A **hash** of each refresh token is stored in the DB so it can be revoked; refresh **rotates** the pair (old token rejected after use).
- **Email verification & password reset** — both use `crypto.randomBytes(32)` to generate a raw token that is emailed, while only its **SHA-256 hash** is stored. A database leak therefore can't be used to verify accounts or reset passwords. Tokens expire (10 min for reset).
- **Account lockout** — 5 failed logins set a 2-hour lock; the counter resets on a successful login or after the lock expires.
- **Rate limiting** — `express-rate-limit` caps auth routes at 20 requests / 15 min and reset routes at 5 / hour, blunting brute-force and email-spam attacks.
- **Account enumeration protection** — `forgot-password` returns the **same 200 response** whether or not the email exists, so attackers can't discover which emails are registered.
- **Session invalidation** — a successful password reset deletes **all** of that user's refresh tokens, forcing a fresh login everywhere.

---

## 📝 What I Learned

- Designing a complete auth lifecycle: signup → verify → login → reset → logout
- Sending transactional email with **Nodemailer**, using Ethereal for friction-free dev testing
- Generating secure single-use tokens with `crypto.randomBytes` and storing only their hashes
- Implementing **account lockout** and **rate limiting** as layered brute-force defences
- Preventing **account enumeration** by keeping responses identical regardless of input
- Revoking all sessions on password reset by clearing stored refresh tokens
- Enforcing password strength rules and consistent validation error responses

---

## 📄 License

MIT — part of my full-stack portfolio (Phase 3).
