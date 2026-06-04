// ─────────────────────────────────────────────────────────────
//  middleware/errorHandler.js
//  Centralised error handling. Instead of writing try/catch JSON
//  responses everywhere, controllers can just throw / call next(err)
//  and these handlers turn it into a clean JSON response.
// ─────────────────────────────────────────────────────────────

/**
 * "404 Not Found" handler.
 * Runs when no route matched the request URL. We build an Error and
 * forward it to the main error handler below via next().
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * The main error handler.
 * Express recognises a middleware as an error handler when it has FOUR
 * arguments: (err, req, res, next). It catches anything passed to next(err)
 * or thrown in an async handler that we forward.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // If a controller already set a status code (e.g. 400), keep it.
  // Otherwise default to 500 (Internal Server Error).
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  // Mongoose: invalid ObjectId (e.g. GET /api/tasks/not-a-real-id)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found (invalid id)';
  }

  // Mongoose: duplicate key (e.g. registering with an existing email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  res.status(statusCode).json({
    message,
    // Only expose the stack trace while developing — never in production.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
