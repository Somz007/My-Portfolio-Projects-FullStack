const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Allow requests from the React dev server (and production URL).
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); // /api/posts/:postId/comments  +  /api/comments/:id

app.use(notFound);
app.use(errorHandler);

module.exports = app;
