let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

const emitToRoom = (room, event, data) => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
};

const emitTableStatusChanged = (restaurantId, tableData) => {
  emitToRoom(`restaurant:${restaurantId}`, 'table_status_changed', tableData);
  emitToRoom('all_customers', 'table_status_changed', { restaurantId, ...tableData });
};

const emitReservationCreated = (restaurantId, reservation) => {
  emitToRoom(`restaurant:${restaurantId}`, 'reservation_created', reservation);
};

const emitReservationUpdated = (userId, restaurantId, reservation) => {
  emitToRoom(`user:${userId}`, 'reservation_updated', reservation);
  emitToRoom(`restaurant:${restaurantId}`, 'reservation_updated', reservation);
};

const emitOrderCreated = (restaurantId, order) => {
  emitToRoom(`restaurant:${restaurantId}`, 'order_created', order);
};

const emitOrderStatusChanged = (userId, restaurantId, order) => {
  emitToRoom(`user:${userId}`, 'order_status_changed', order);
  emitToRoom(`restaurant:${restaurantId}`, 'order_status_changed', order);
};

const emitWaitTimeUpdated = (restaurantId, waitTimeData) => {
  emitToRoom(`restaurant:${restaurantId}`, 'wait_time_updated', waitTimeData);
  emitToRoom('all_customers', 'wait_time_updated', { restaurantId, ...waitTimeData });
};

const emitWaitlistUpdated = (restaurantId, waitlistEntry) => {
  emitToRoom(`restaurant:${restaurantId}`, 'waitlist_updated', waitlistEntry);
  if (waitlistEntry.user_id) {
    emitToRoom(`user:${waitlistEntry.user_id}`, 'waitlist_entry_updated', waitlistEntry);
  }
};

const emitNotificationCreated = (userId, notification) => {
  emitToRoom(`user:${userId}`, 'notification_created', notification);
};

const emitCustomerCheckedIn = (userId, restaurantId, reservation) => {
  emitToRoom(`user:${userId}`, 'customer_checked_in', reservation);
  emitToRoom(`restaurant:${restaurantId}`, 'customer_checked_in', reservation);
};

const emitCustomerSeated = (userId, restaurantId, reservation) => {
  emitToRoom(`user:${userId}`, 'customer_seated', reservation);
  emitToRoom(`restaurant:${restaurantId}`, 'customer_seated', reservation);
};

const emitFoodReady = (userId, restaurantId, order) => {
  emitToRoom(`user:${userId}`, 'food_ready', order);
  emitToRoom(`restaurant:${restaurantId}`, 'food_ready', order);
};

const emitInventoryLow = (restaurantId, item) => {
  emitToRoom(`restaurant:${restaurantId}`, 'inventory_low', item);
};

const emitReviewCreated = (restaurantId, review) => {
  emitToRoom(`restaurant:${restaurantId}`, 'review_created', review);
};

module.exports = {
  setIO,
  getIO,
  emitToRoom,
  emitTableStatusChanged,
  emitReservationCreated,
  emitReservationUpdated,
  emitCustomerCheckedIn,
  emitCustomerSeated,
  emitOrderCreated,
  emitOrderStatusChanged,
  emitFoodReady,
  emitWaitTimeUpdated,
  emitWaitlistUpdated,
  emitNotificationCreated,
  emitInventoryLow,
  emitReviewCreated
};
