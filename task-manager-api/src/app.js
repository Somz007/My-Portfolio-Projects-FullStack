// ─────────────────────────────────────────────────────────────
//  app.js
//  Builds and configures the Express application: global middleware,
//  routes, and error handling. It does NOT start the server or connect
//  to the DB — that's server.js's job. Keeping them separate makes the
//  app easy to import in tests later.
// ─────────────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Global middleware (runs on every request, in order) ──────────────
app.use(cors()); // allow requests from other origins (e.g. a React frontend)
app.use(express.json()); // parse incoming JSON bodies into req.body

// Log requests to the console while developing. "dev" = concise coloured output.
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Health check ─────────────────────────────────────────────────────
// A simple route to confirm the API is alive (handy for uptime checks).
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Task Manager API is running' });
});

// ── Feature routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ── Error handling (must be LAST, after all routes) ──────────────────
app.use(notFound); // 404 for any unmatched route
app.use(errorHandler); // converts errors into clean JSON responses

module.exports = app;
