const logger = require('../utils/logger');
const { setIO } = require('./socketEmitter');

// In-memory active user and socket tracking
const activeSockets = new Map(); // socket.id -> { userId, connectedAt, role }
const activeUserCounts = new Map(); // userId -> count

const getOnlineStats = () => {
  return {
    totalSockets: activeSockets.size,
    uniqueOnlineUsers: activeUserCounts.size,
    onlineUserIds: Array.from(activeUserCounts.keys())
  };
};

const setupSockets = (io) => {
  setIO(io);

  io.on('connection', (socket) => {
    logger.info(`⚡ Socket Client connected: ${socket.id}`);
    activeSockets.set(socket.id, { connectedAt: new Date() });

    // Join user-specific notification room
    socket.on('join_user', (userId, meta = {}) => {
      if (userId) {
        socket.join(`user:${userId}`);
        const currentCount = activeUserCounts.get(userId) || 0;
        activeUserCounts.set(userId, currentCount + 1);

        activeSockets.set(socket.id, {
          userId,
          role: meta.role || 'CUSTOMER',
          connectedAt: new Date()
        });

        logger.info(`User ${userId} joined room user:${userId} (Total Active: ${activeUserCounts.size})`);
      }
    });

    // Join restaurant-specific room (for floor plan, kitchen, reservations)
    socket.on('join_restaurant', (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant:${restaurantId}`);
        logger.info(`Socket ${socket.id} joined room restaurant:${restaurantId}`);
      }
    });

    // Leave restaurant room
    socket.on('leave_restaurant', (restaurantId) => {
      if (restaurantId) {
        socket.leave(`restaurant:${restaurantId}`);
      }
    });

    // Join general customer discovery room
    socket.on('join_discovery', () => {
      socket.join('all_customers');
    });

    socket.on('disconnect', () => {
      const socketInfo = activeSockets.get(socket.id);
      if (socketInfo && socketInfo.userId) {
        const remaining = (activeUserCounts.get(socketInfo.userId) || 1) - 1;
        if (remaining <= 0) {
          activeUserCounts.delete(socketInfo.userId);
        } else {
          activeUserCounts.set(socketInfo.userId, remaining);
        }
      }
      activeSockets.delete(socket.id);
      logger.info(`Socket Client disconnected: ${socket.id} (Remaining Active: ${activeUserCounts.size})`);
    });
  });
};

module.exports = {
  setupSockets,
  getOnlineStats
};

