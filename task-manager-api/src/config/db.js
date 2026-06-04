// ─────────────────────────────────────────────────────────────
//  config/db.js
//  Responsible for ONE thing: connecting our app to MongoDB.
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const dns = require('dns');

/**
 * Some networks/ISPs run DNS resolvers that can't answer the "SRV" record
 * lookups that a "mongodb+srv://" Atlas connection string requires, which
 * causes a "querySrv ECONNREFUSED" error. To stay reliable everywhere, we
 * point Node's DNS lookups at Google's public DNS servers (8.8.8.8 / 8.8.4.4).
 * This only affects DNS resolution, not the database traffic itself.
 */
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connect to MongoDB using the connection string in process.env.MONGO_URI.
 *
 * This is an "async" function because connecting to a database takes time
 * (it happens over the network). We use "await" to pause until the
 * connection either succeeds or throws an error.
 *
 * If the connection fails, there is no point keeping the app alive, so we
 * log the error and exit the process with a non-zero code (1 = failure).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Stop the app — it can't work without a database.
  }
};

module.exports = connectDB;
