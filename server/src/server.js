require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./services/notification');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB Database
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Allowed origins for Socket.IO
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  // Setup Socket.IO with CORS
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true
    }
  });

  initSocket(io);

  server.listen(PORT, () => {
    console.log(`[Server] CivicProof backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Server] Health check available at: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP and WebSocket listeners closed.');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled Rejection:', err.message || err);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message || err);
  process.exit(1);
});

startServer().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});
