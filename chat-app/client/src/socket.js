// ─────────────────────────────────────────────────────────────
//  src/socket.js
//  Creates and exports the Socket.io client instance.
//
//  We create it once at module level so the same connection is
//  reused across the whole app. autoConnect: false means it won't
//  connect until we explicitly call socket.connect() — we do that
//  only after the user submits the join form.
// ─────────────────────────────────────────────────────────────
import { io } from 'socket.io-client';

const socket = io({
  autoConnect: false, // connect manually after user fills in the join form
  // In dev, Vite's proxy forwards /socket.io → localhost:5003.
  // In production you'd pass the server URL here explicitly.
});

export default socket;
