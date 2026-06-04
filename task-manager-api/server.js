// ─────────────────────────────────────────────────────────────
//  server.js
//  The ENTRY POINT of the application. Run with `npm run dev`.
//  Order matters:
//    1. Load environment variables (.env) FIRST so everything else
//       can read process.env.
//    2. Connect to MongoDB.
//    3. Start listening for HTTP requests.
// ─────────────────────────────────────────────────────────────
require('dotenv').config(); // loads .env into process.env

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to the database, then start the server only once connected.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
