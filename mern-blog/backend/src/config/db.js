const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to handle the SRV lookup that mongodb+srv:// requires.
// The local network DNS resolver can't resolve these records (ECONNREFUSED).
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
