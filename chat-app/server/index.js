// ─────────────────────────────────────────────────────────────
//  server/index.js
//  Express + Socket.io real-time chat server.
//
//  NO DATABASE — state is kept in memory (Maps/Sets) for simplicity.
//  This means the chat history resets when the server restarts, which
//  is fine for a portfolio demo. A production app would persist to
//  MongoDB or Redis.
//
//  HOW SOCKET.IO WORKS:
//  1. A client connects → Socket.io fires the 'connection' event and
//     gives us a `socket` object representing that one client.
//  2. We listen for events the client emits (e.g. 'join_room').
//  3. We emit events back to one client (socket.emit), to a room
//     (io.to(room).emit), or to everyone except the sender
//     (socket.broadcast.to(room).emit).
//  4. When the client disconnects, Socket.io fires 'disconnect'.
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const http    = require('http');
const cors    = require('cors');
const { Server } = require('socket.io');

const PORT               = process.env.PORT        || 5003;
const CLIENT_URL         = process.env.CLIENT_URL  || 'http://localhost:5175';
const HISTORY_LIMIT      = Number(process.env.ROOM_HISTORY_LIMIT) || 50;

// ── Available rooms ───────────────────────────────────────────
// Pre-defined rooms users can join. In a production app these would
// be stored in a DB and users could create their own.
const ROOMS = ['general', 'tech', 'random', 'south-africa'];

// ── In-memory state ───────────────────────────────────────────
// roomHistory: Map<roomName, Message[]>  — last N messages per room
// socketUsers: Map<socketId, { username, room }> — who is each socket
const roomHistory = new Map(ROOMS.map((r) => [r, []]));
const socketUsers = new Map();

// ── Express + HTTP server ─────────────────────────────────────
const app    = express();
const server = http.createServer(app); // Socket.io needs the raw http.Server

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// REST endpoint: list rooms with live user counts (used on the join screen)
app.get('/api/rooms', (req, res) => {
  const rooms = ROOMS.map((name) => ({
    name,
    // Count how many connected sockets are in this room
    userCount: [...socketUsers.values()].filter((u) => u.room === name).length,
  }));
  res.json(rooms);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Socket.io setup ───────────────────────────────────────────
// We pass cors config here too — Socket.io has its own CORS handling
// separate from Express.
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

// ── Helper: build a message object ───────────────────────────
const makeMessage = (type, username, text, room) => ({
  id:        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,      // 'chat' | 'system'
  username,
  text,
  room,
  timestamp: new Date().toISOString(),
});

// ── Helper: get users in a room ───────────────────────────────
const getUsersInRoom = (room) =>
  [...socketUsers.values()]
    .filter((u) => u.room === room)
    .map((u) => u.username);

// ── Socket event handlers ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // ── join_room ───────────────────────────────────────────────
  // Client emits this when the user picks a username + room.
  // Payload: { username: string, room: string }
  socket.on('join_room', ({ username, room }) => {
    if (!username?.trim() || !ROOMS.includes(room)) {
      socket.emit('error', { message: 'Invalid username or room' });
      return;
    }

    // If the socket was already in a room, leave it first.
    const existing = socketUsers.get(socket.id);
    if (existing) {
      socket.leave(existing.room);
      const leaveMsg = makeMessage('system', 'System', `${existing.username} left`, existing.room);
      socket.broadcast.to(existing.room).emit('receive_message', leaveMsg);
      io.to(existing.room).emit('room_users', getUsersInRoom(existing.room));
    }

    // Join the new room and record the user.
    socket.join(room);
    socketUsers.set(socket.id, { username: username.trim(), room });

    // 1. Confirm join FIRST so the client can start listening for subsequent events.
    socket.emit('joined', { room, username });

    // 2. Send the room's recent history to the joining user.
    socket.emit('room_history', roomHistory.get(room) || []);

    // 3. Send the updated user list to everyone in the room.
    io.to(room).emit('room_users', getUsersInRoom(room));

    // 4. Announce to everyone else in the room.
    const joinMsg = makeMessage('system', 'System', `${username} joined`, room);
    socket.broadcast.to(room).emit('receive_message', joinMsg);

    console.log(`${username} joined room: ${room}`);
  });

  // ── send_message ────────────────────────────────────────────
  // Client emits this when the user sends a chat message.
  // Payload: { text: string }
  socket.on('send_message', ({ text }) => {
    const user = socketUsers.get(socket.id);
    if (!user || !text?.trim()) return;

    const msg = makeMessage('chat', user.username, text.trim(), user.room);

    // Store in history, capped at HISTORY_LIMIT.
    const history = roomHistory.get(user.room);
    history.push(msg);
    if (history.length > HISTORY_LIMIT) history.shift();

    // Broadcast to everyone in the room INCLUDING the sender.
    // (The sender needs to see their own message confirmed by the server
    //  so the UI stays consistent with what others see.)
    io.to(user.room).emit('receive_message', msg);
  });

  // ── typing ──────────────────────────────────────────────────
  // Client emits while the user is typing. We relay it to the room
  // (excluding the sender) so others see "Alice is typing…".
  socket.on('typing', ({ isTyping }) => {
    const user = socketUsers.get(socket.id);
    if (!user) return;
    socket.broadcast.to(user.room).emit('user_typing', {
      username: user.username,
      isTyping,
    });
  });

  // ── disconnect ──────────────────────────────────────────────
  socket.on('disconnect', () => {
    const user = socketUsers.get(socket.id);
    if (user) {
      socketUsers.delete(socket.id);
      const leaveMsg = makeMessage('system', 'System', `${user.username} left`, user.room);
      io.to(user.room).emit('receive_message', leaveMsg);
      io.to(user.room).emit('room_users', getUsersInRoom(user.room));
      console.log(`${user.username} disconnected`);
    }
  });
});

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
  console.log(`Rooms: ${ROOMS.join(', ')}`);
});
