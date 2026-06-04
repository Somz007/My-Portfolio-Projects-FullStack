# Real-Time Chat App

A real-time chat application where multiple users join named rooms and message each other live.

## 🚀 Live Demo

**Frontend:** https://somz007.github.io/My-Portfolio-Projects-FullStack/chat-app/
**Backend API:** https://chat-app-backend-somz007.onrender.com

> Open in two browser tabs with different usernames to chat in real time. Built with **Socket.io**, **Express**, and **React** — messages, presence, and typing indicators all update instantly across every connected client, with no page refreshes or polling.

---

## ✨ Features

- 💬 **Real-time messaging** — messages appear instantly for everyone in the room
- 🚪 **Named rooms** — `general`, `tech`, `random`, `south-africa`, each isolated
- 👥 **Live presence** — see who's online in each room, updated as people join/leave
- ✍️ **Typing indicators** — "Alice is typing…" relayed to others in the room
- 📜 **Room history** — the last 50 messages are shown to users when they join
- 🔔 **Join/leave notifications** — system messages when users come and go
- 🔢 **Live room counts** — the join screen shows how many people are in each room
- ⚡ **No database** — state is held in memory for a fast, zero-config demo

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| Socket.io | WebSocket transport with rooms, broadcasting, auto-reconnect |
| Express | HTTP server + REST endpoint for room counts |
| React | Component-based chat UI |
| Vite | Frontend dev server with WebSocket proxy |
| socket.io-client | Client-side Socket.io connection |

---

## 📁 Project Structure

```
chat-app/
├── server/
│   ├── index.js              # Express + Socket.io server (rooms, history, presence)
│   ├── .env                  # PORT, CLIENT_URL, ROOM_HISTORY_LIMIT
│   └── package.json
└── client/
    ├── src/
    │   ├── socket.js         # Socket.io client instance (autoConnect: false)
    │   ├── App.jsx           # Join/chat state + socket lifecycle
    │   └── components/
    │       ├── JoinForm.jsx  # Username + room picker with live counts
    │       ├── ChatRoom.jsx  # Main chat UI; registers all socket listeners
    │       ├── MessageList.jsx  # Auto-scrolling message list (own vs others)
    │       └── UserList.jsx  # Online users sidebar
    ├── vite.config.js        # Proxies /api and /socket.io to the server
    └── package.json
```

---

## 🔌 How the Real-Time Layer Works

Everything is **named events** flowing over a persistent WebSocket connection:

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join_room` | client → server | User picks a username + room |
| `joined` | server → client | Confirms the join |
| `room_history` | server → client | Last 50 messages in the room |
| `room_users` | server → room | Updated list of online users |
| `send_message` | client → server | User sends a chat message |
| `receive_message` | server → room | Broadcast message (incl. system notices) |
| `typing` | client → server | User started/stopped typing |
| `user_typing` | server → room | Relayed to others (not the sender) |

**Rooms** are the key concept: `socket.join(room)` subscribes a client, and `io.to(room).emit(...)` sends only to that room — which is how `#tech` never sees `#general`'s messages. `socket.broadcast.to(room).emit(...)` sends to everyone *except* the sender, used for join/leave notices and typing.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- No database required — state is in memory

### Run it (two terminals)
```bash
# Terminal 1 — server
cd chat-app/server
npm install
npm run dev                 # http://localhost:5003

# Terminal 2 — client
cd chat-app/client
npm install
npm run dev                 # http://localhost:5175
```

Open `http://localhost:5175` in **two or more browser tabs**, pick different usernames, join the same room, and watch messages sync in real time.

> The Vite dev server proxies both `/api` (REST) and `/socket.io` (the WebSocket upgrade) to the server on port 5003 — so the client code never hardcodes the backend URL.

---

## 📝 Notes

- **In-memory state:** chat history resets when the server restarts. A production version would persist messages to MongoDB or Redis and use Redis pub/sub to scale across multiple server instances.
- **Listener cleanup:** every `socket.on()` in `ChatRoom.jsx` has a matching `socket.off()` in the `useEffect` cleanup — without this, React StrictMode would stack duplicate listeners and you'd see every message twice.

---

## 📦 What I Learned

- The difference between **HTTP request/response and persistent WebSocket connections** — and when each is the right tool
- Structuring a **Socket.io event protocol** with clear client→server and server→room directions
- Using **rooms** for message isolation and `broadcast` to exclude the sender
- Managing **presence** (who's online) and **ephemeral state** (typing) without a database
- Avoiding duplicate-listener bugs by pairing every `socket.on` with a `socket.off` on unmount
- Proxying a **WebSocket upgrade** through Vite so dev and production use the same code paths

---

## 📄 License

MIT — part of my full-stack portfolio (Phase 3).
