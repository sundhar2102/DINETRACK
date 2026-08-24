const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const { getDb } = require('./database/db');
const routes = require('./src/routes');
const { setupSockets } = require('./src/sockets/socketHandler');
const { errorHandler } = require('./src/middleware/error.middleware');
const { apiLimiter } = require('./src/middleware/rateLimiter.middleware');

const app = express();
const server = http.createServer(app);

// 1. Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'capacitor://localhost',
  'http://localhost'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev mode
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 2. Sockets Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});
setupSockets(io);

// 3. API Routes & Rate Limiting
app.use('/api', apiLimiter, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'SmartTable AI Platform Backend is running smoothly 🚀',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// 4. 404 & Centralized Error Handler
app.use((req, res, next) => {
  const err = new Error(`Resource Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  err.isOperational = true;
  next(err);
});

app.use(errorHandler);

// 5. Start Server & Initialize Database
const startServer = async () => {
  try {
    // Ensure DB connection and schema ready
    await getDb();

    const PORT = env.PORT;
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 SmartTable AI Backend running on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📡 Socket.IO Real-Time Engine online and listening`);
    });
  } catch (err) {
    logger.error('Failed to initialize server:', err);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server };
