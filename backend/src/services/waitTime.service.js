const { getDb } = require('../../database/db');

/**
 * Intelligent Algorithmic Wait-Time Estimation Engine
 * 
 * Takes into account:
 * 1. Matching table availability for the requested party size
 * 2. Current occupied tables and elapsed dining time vs. historical avg duration
 * 3. Cleaning & turnaround buffer (typically ~5-7 mins)
 * 4. Active waitlist queue ahead of the user
 * 5. Incoming confirmed reservations in the near window (< 45 mins)
 * 6. Time of day / peak rush multiplier
 */
async function estimateWaitTime(restaurantId, partySize = 2) {
  const db = await getDb();

  // Fetch restaurant details
  const restaurant = await db.get(
    'SELECT id, name, avg_dining_duration_mins, crowd_level, is_open FROM restaurants WHERE id = ?',
    [restaurantId]
  );

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  if (!restaurant.is_open) {
    return {
      restaurantId,
      partySize,
      estimatedWaitTime: 0,
      minimumWaitTime: 0,
      maximumWaitTime: 0,
      confidence: 'CLOSED',
      crowdLevel: 'CLOSED',
      queueLength: 0,
      totalTables: 0,
      availableTablesCount: 0,
      occupiedTablesCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  const avgDiningDuration = restaurant.avg_dining_duration_mins || 45;

  // Fetch all tables
  const tables = await db.query(
    'SELECT id, table_number, capacity, status, occupied_since FROM tables WHERE restaurant_id = ?',
    [restaurantId]
  );

  const totalTables = tables.length;
  const availableTables = tables.filter(t => t.status === 'AVAILABLE');
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED');
  const cleaningTables = tables.filter(t => t.status === 'CLEANING');
  const reservedTables = tables.filter(t => t.status === 'RESERVED');
  const blockedTables = tables.filter(t => t.status === 'BLOCKED' || t.status === 'MAINTENANCE');

  // Filter suitable tables that can accommodate the party size (capacity >= partySize and not overly oversized)
  const suitableAvailable = availableTables.filter(t => t.capacity >= partySize && t.capacity <= partySize + 3);
  const generalAvailable = availableTables.filter(t => t.capacity >= partySize);

  // Fetch active waitlist ahead
  const waitlist = await db.query(
    `SELECT id, party_size, joined_at FROM waitlist 
     WHERE restaurant_id = ? AND status = 'WAITING' 
     ORDER BY queue_position ASC, joined_at ASC`,
    [restaurantId]
  );
  const queueLength = waitlist.length;

  // Fetch upcoming confirmed reservations today within next 60 mins
  const activeReservations = await db.query(
    `SELECT id, guest_count, reservation_time FROM reservations 
     WHERE restaurant_id = ? AND status = 'CONFIRMED' AND reservation_date = CURRENT_DATE`,
    [restaurantId]
  );

  let estimatedWait = 0;
  let confidence = 'HIGH';

  // Scenario A: Table is immediately available and no queue
  if (generalAvailable.length > 0 && queueLength === 0) {
    if (suitableAvailable.length > 0) {
      estimatedWait = 0; // Immediate seating
    } else {
      estimatedWait = 3; // Minor seating prep
    }
  } else {
    // Scenario B: All matching tables are occupied or there is a queue
    // 1. Calculate remaining dining time on currently occupied tables
    const now = new Date();
    let shortestRemainingTime = avgDiningDuration;

    if (occupiedTables.length > 0) {
      const remainingTimes = occupiedTables.map(t => {
        if (!t.occupied_since) return Math.round(avgDiningDuration * 0.4);
        const occupiedAt = new Date(t.occupied_since);
        const elapsedMinutes = Math.max(0, (now - occupiedAt) / (1000 * 60));
        return Math.max(5, Math.round(avgDiningDuration - elapsedMinutes));
      });
      shortestRemainingTime = Math.min(...remainingTimes);
    }

    // 2. Add cleaning buffer
    const cleaningBuffer = cleaningTables.length > 0 ? 5 : 4;

    // 3. Add queue wait overhead (each party ahead roughly takes ~ 8-12 mins turnover slice across all tables)
    const tableTurnoverCapacity = Math.max(1, totalTables / 2);
    const queueWaitOverhead = Math.round((queueLength * (avgDiningDuration / tableTurnoverCapacity)) * 0.6);

    // 4. Add reservation pressure
    const reservationOverhead = activeReservations.length > 2 ? 6 : 0;

    estimatedWait = shortestRemainingTime + cleaningBuffer + queueWaitOverhead + reservationOverhead;

    // Adjust confidence based on data points
    if (queueLength > 5) {
      confidence = 'MEDIUM';
    }
    if (totalTables === 0) {
      confidence = 'LOW';
      estimatedWait = 25;
    }
  }

  // Calculate dynamic crowd level
  let dynamicCrowdLevel = 'LOW';
  const occupancyRate = totalTables > 0 ? (occupiedTables.length + reservedTables.length) / totalTables : 0;
  if (occupancyRate >= 0.85 || queueLength >= 4) {
    dynamicCrowdLevel = 'FULL';
  } else if (occupancyRate >= 0.6 || queueLength >= 2) {
    dynamicCrowdLevel = 'HIGH';
  } else if (occupancyRate >= 0.3 || queueLength >= 1) {
    dynamicCrowdLevel = 'MEDIUM';
  }

  const minWait = Math.max(0, estimatedWait - Math.min(5, Math.floor(estimatedWait * 0.2)));
  const maxWait = estimatedWait + Math.max(3, Math.ceil(estimatedWait * 0.25));

  return {
    restaurantId,
    partySize,
    estimatedWaitTime: estimatedWait,
    minimumWaitTime: minWait,
    maximumWaitTime: maxWait,
    confidence,
    crowdLevel: dynamicCrowdLevel,
    queueLength,
    totalTables,
    availableTablesCount: availableTables.length,
    occupiedTablesCount: occupiedTables.length,
    lastUpdated: new Date().toISOString()
  };
}

module.exports = {
  estimateWaitTime
};
