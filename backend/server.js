import 'dotenv/config';
import app from './src/app.js';
import prisma from './src/config/db.js';

let initialPort = parseInt(process.env.PORT, 10) || 5000;
let server;

const startServer = (portToTry) => {
  server = app
    .listen(portToTry, () => {
      console.log(`================================================`);
      console.log(`  MEDHUB Backend API running on port ${portToTry}`);
      console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Client URL  : ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`================================================`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[PORT WARNING] Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
        setTimeout(() => {
          startServer(portToTry + 1);
        }, 500);
      } else {
        console.error('Server error:', err);
      }
    });
};

startServer(initialPort);

// Graceful Shutdown Handler
const shutdown = async (signal) => {
  console.log(`\n[${signal}] Shutting down MEDHUB server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await prisma.$disconnect();
      console.log('Prisma Client disconnected.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});
