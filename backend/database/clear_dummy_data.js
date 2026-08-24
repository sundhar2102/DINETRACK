const { getDb } = require('./db');

async function cleanDummyData() {
  const db = await getDb();
  console.log('🧹 Clearing all dummy / test waitlists, reservations, and orders from database...');

  await db.transaction(async (tx) => {
    // 1. Clear waitlist
    await tx.run('DELETE FROM waitlist');
    console.log('   ✅ Cleared waitlist queue.');

    // 2. Clear order items, orders, payments
    await tx.run('DELETE FROM order_items');
    await tx.run('DELETE FROM payments');
    await tx.run('DELETE FROM orders');
    console.log('   ✅ Cleared orders and order items.');

    // 3. Clear reservations and history
    await tx.run('DELETE FROM reservation_status_history');
    await tx.run('DELETE FROM reservations');
    console.log('   ✅ Cleared reservations.');

    // 4. Reset all tables to AVAILABLE
    await tx.run(`UPDATE tables SET status = 'AVAILABLE', current_reservation_id = NULL, occupied_since = NULL`);
    console.log('   ✅ Reset all tables to 🟢 AVAILABLE.');
  });

  console.log('🎉 Database is now 100% CLEAN. Only real manual customer actions will create orders or bookings!');
  process.exit(0);
}

cleanDummyData().catch(err => {
  console.error('❌ Error cleaning data:', err);
  process.exit(1);
});
