const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  if (err.name === 'CastError' && err.kind === 'ObjectId') { statusCode = 404; message = 'Resource not found'; }
  if (err.code === 11000) { statusCode = 400; message = `Duplicate value for ${Object.keys(err.keyValue || {})[0]}`; }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
