# My Portfolio — Full-Stack Projects

> A collection of six production-style full-stack projects spanning REST APIs, the MERN stack, data engineering, security, real-time systems, and mobile development.

**Author:** [@Somz007](https://github.com/Somz007) · **Stack:** Node.js · Express · MongoDB · React · React Native · Flask · Pandas · Socket.io

---

## 📌 Overview

This repository is **Phase 3** of my developer portfolio — a focused push from front-end into full-stack and backend engineering. Each project is self-contained, runnable, and was verified end-to-end (live API smoke tests, production builds, and a multi-event WebSocket test). Together they cover the technologies most requested in South African junior developer roles.

---

## 🗂️ Projects

| # | Project | Live Demo | Stack | Headline Skill |
|---|---------|-----------|-------|----------------|
| 1 | [Task Manager API](./task-manager-api) | — | Node.js · Express · MongoDB · JWT · Jest | REST API design with **52 automated tests** (Jest + Supertest) |
| 2 | [MERN Blog Platform](./mern-blog) | [🔗 Live](https://somz007.github.io/My-Portfolio-Projects-FullStack/mern-blog/) | MongoDB · Express · React · Node | Full-stack wiring with **Axios silent-refresh** auth |
| 3 | [Data Dashboard](./data-dashboard) | — | Flask · Pandas · Chart.js | **Python data processing** from a live public API |
| 4 | [Authentication System](./auth-system) | [🔗 Live](https://somz007.github.io/My-Portfolio-Projects-FullStack/auth-system/) | Node · JWT · bcrypt · Nodemailer | **Email verification, password reset, rate limiting** |
| 5 | [Real-Time Chat](./chat-app) | [🔗 Live](https://somz007.github.io/My-Portfolio-Projects-FullStack/chat-app/) | Socket.io · React · Express | **WebSockets** — rooms, broadcasting, typing indicators |
| 6 | [Expense Tracker](./expense-tracker) | — | React Native · Expo · AsyncStorage | **Mobile (Android)** with offline-first persistence |

---

## 🧰 Skills Demonstrated

| Technology | Where & How |
|------------|-------------|
| **Node.js** | Runtime for projects 1, 2, 4, 5 — REST APIs, WebSocket servers, async workflows |
| **Express** | Routing, middleware, error handling, and rate limiting across all Node backends |
| **MongoDB** (Mongoose) | Schemas, relationships, indexes, and TTL collections in projects 1, 2, 4 |
| **JWT** | Access + refresh token pattern with rotation and revocation (projects 1, 2, 4) |
| **Socket.io** | Real-time rooms, broadcasts, and presence in project 5 |
| **React** | Hooks, Context, protected routes, and Axios interceptors (projects 2, 4) |
| **React Native** | Expo Router, native components, and AsyncStorage in project 6 |
| **Flask** | Application-factory pattern, Blueprints, and JSON APIs in project 3 |
| **Pandas** | DataFrame pipelines — `dropna`, `pct_change`, `describe`, `concat` (project 3) |

**Cross-cutting:** bcrypt password hashing · input validation · CORS · environment-based config · Postman testing · automated testing (Jest/Supertest) · Git workflow.

---

## 🚀 Running the Projects Locally

Clone the repo first:

```bash
git clone https://github.com/Somz007/My-Portfolio-Projects-FullStack.git
cd My-Portfolio-Projects-FullStack
```

### ⚠️ Prerequisites by project

| Requirement | Needed for |
|-------------|------------|
| **MongoDB Atlas** connection string in `.env` | Projects **1, 2, 4** |
| **Python 3** environment (`venv`) | Project **3** |
| **Expo CLI** + Expo Go app (or Android emulator) | Project **6** |
| Node.js 18+ | Projects 1, 2, 4, 5 (and the React frontends of 2 & 4) |

> Each backend ships a `.env.example`. Copy it to `.env` and fill in your values. The real `.env` files are git-ignored — never commit secrets.

---

### 1 · Task Manager API
```bash
cd task-manager-api
npm install
cp .env.example .env        # add your MongoDB Atlas URI + JWT secrets
npm run dev                 # http://localhost:5000
npm test                    # run the 52-test Jest suite
```

### 2 · MERN Blog Platform
Two terminals — backend then frontend:
```bash
# Terminal 1
cd mern-blog/backend
npm install
cp .env.example .env        # add MongoDB Atlas URI + JWT secrets
npm run dev                 # http://localhost:5000

# Terminal 2
cd mern-blog/frontend
npm install
npm run dev                 # http://localhost:5173
```

### 3 · Data Dashboard (Python)
```bash
cd data-dashboard
python -m venv venv
venv\Scripts\activate       # Windows  (use: source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
python run.py               # http://localhost:5001
```
No API key required — pulls live data from the free World Bank Open Data API.

### 4 · Authentication System
Two terminals — backend then frontend:
```bash
# Terminal 1
cd auth-system/backend
npm install
cp .env.example .env        # add MongoDB Atlas URI + JWT secrets
npm run dev                 # http://localhost:5002

# Terminal 2
cd auth-system/frontend
npm install
npm run dev                 # http://localhost:5174
```
Emails (verification + password reset) use **Ethereal** in development — the server console prints a preview URL for each email. No real inbox needed.

### 5 · Real-Time Chat
No database required (in-memory state). Two terminals:
```bash
# Terminal 1
cd chat-app/server
npm install
npm run dev                 # http://localhost:5003

# Terminal 2
cd chat-app/client
npm install
npm run dev                 # http://localhost:5175
```
Open the client in **two browser tabs** with different usernames to chat in real time.

### 6 · Expense Tracker (React Native / Expo)
```bash
cd expense-tracker
npm install
npx expo start              # scan the QR code with the Expo Go app
```
Requires the **Expo CLI** (bundled via `npx`) and the **Expo Go** app on your Android phone — phone and computer must share the same WiFi. Press `a` in the terminal to launch on an Android emulator instead.

---

## 📁 Repository Structure

```
My-Portfolio-Projects-FullStack/
├── task-manager-api/     # Project 1 — REST API + JWT + Jest tests
├── mern-blog/            # Project 2 — MERN stack (backend + frontend)
├── data-dashboard/       # Project 3 — Flask + Pandas + Chart.js
├── auth-system/          # Project 4 — Auth (backend + frontend)
├── chat-app/             # Project 5 — Socket.io (server + client)
├── expense-tracker/      # Project 6 — React Native + Expo
└── README.md             # You are here
```

---

## 📄 License

MIT © [Somz007](https://github.com/Somz007)
