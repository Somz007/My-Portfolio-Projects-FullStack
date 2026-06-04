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

// In production (GitHub Pages), connect directly to the Render backend.
// In dev, pass no URL — Vite's proxy forwards /socket.io → localhost:5003.
const BACKEND_URL = import.meta.env.PROD
  ? 'https://chat-app-backend-somz007.onrender.com'
  : undefined;

const socket = io(BACKEND_URL, {
  autoConnect: false,
});

export default socket;
