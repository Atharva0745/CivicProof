const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB (e.g. MongoDB Atlas or self-hosted instance).
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Database] Fatal: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[Database] MongoDB Connected successfully....`);

    // Listen for runtime connection events
    mongoose.connection.on('error', (err) => {
      console.error('[Database] Runtime MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection lost. Waiting for reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB reconnected successfully.');
    });

    return conn;
  } catch (error) {
    console.error(`[Database] Critical MongoDB connection failure: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully closes MongoDB connection
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected successfully.');
  } catch (err) {
    console.error('[Database] Error while disconnecting MongoDB:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
