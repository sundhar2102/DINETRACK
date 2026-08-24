/**
 * Suite 11: Waitlist & Virtual Queue Management
 * 14 Test Cases
 */
module.exports = {
  suiteId: 'WEB-WAIT-11',
  suiteName: 'Waitlist & Virtual Queue Management',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-WAIT-001',
      title: 'Display "Join Waitlist" when All Tables are Fully Booked',
      description: 'Check restaurant detail page when all slots are occupied',
      expected: 'Displays "Join Waitlist" button with current queue count and estimated wait',
    },
    {
      id: 'ST-WEB-WAIT-002',
      title: 'Customer Joins Waitlist Flow',
      description: 'Select party size (4) and click "Join Waitlist"',
      expected: 'Waitlist entry created, queue position assigned (e.g. #3 in queue)',
    },
    {
      id: 'ST-WEB-WAIT-003',
      title: 'Real-Time Queue Position Tracking Screen',
      description: 'Verify customer can monitor live queue status and estimated minutes',
      expected: 'Dynamic queue tracker displays position updates in real-time',
    },
    {
      id: 'ST-WEB-WAIT-004',
      title: 'Owner View Active Waitlist Queue in Dashboard',
      description: 'Navigate to /owner/waitlist and verify list of waiting parties',
      expected: 'Waitlist table renders guest name, party size, waiting duration, and action buttons',
    },
    {
      id: 'ST-WEB-WAIT-005',
      title: 'Owner Notify Guest: Table Ready Alert',
      description: 'Click "Notify Guest" when a table becomes available',
      expected: 'Sends push/SMS/socket notification: "Your table is ready! Please arrive within 10 mins"',
    },
    {
      id: 'ST-WEB-WAIT-006',
      title: 'Owner Seat Guest from Waitlist (Waitlist -> Seated)',
      description: 'Click "Seat Party" and assign available table (e.g. Table T-3)',
      expected: 'Waitlist entry completed, Table T-3 marked Occupied, and reservation created',
    },
    {
      id: 'ST-WEB-WAIT-007',
      title: 'Customer Self-Leave Waitlist Flow',
      description: 'Click "Leave Queue" on customer live tracker',
      expected: 'Waitlist entry removed, queue numbers for subsequent parties decremented',
    },
    {
      id: 'ST-WEB-WAIT-008',
      title: 'Owner Remove / Cancel Waitlist Entry',
      description: 'Remove unresponsive party from queue',
      expected: 'Party removed and next party in line notified',
    },
    {
      id: 'ST-WEB-WAIT-009',
      title: 'Waitlist Queue Number Recalculation',
      description: 'Verify subsequent queue positions shift up when ahead party leaves',
      expected: 'Queue position updates from #4 to #3 seamlessly',
    },
    {
      id: 'ST-WEB-WAIT-010',
      title: 'Waitlist Estimated Wait Time Algorithm',
      description: 'Verify wait time calculation: (queue_position * average_dining_duration / active_tables)',
      expected: 'Estimated time matches calculated prediction within +-5 mins',
    },
    {
      id: 'ST-WEB-WAIT-011',
      title: 'Duplicate Waitlist Entry Prevention',
      description: 'Attempt to join waitlist twice for same restaurant concurrently',
      expected: 'Validation error: "You already have an active queue position at this restaurant"',
    },
    {
      id: 'ST-WEB-WAIT-012',
      title: 'Table Ready Grace Period Expiry Timer',
      description: 'Verify 10-minute arrival countdown after "Table Ready" notification',
      expected: 'Grace period timer decrements live and auto-expires if diner fails to show',
    },
    {
      id: 'ST-WEB-WAIT-013',
      title: 'Socket.IO Live Queue Updates Broadcast',
      description: 'Verify queue position changes broadcast to customer WebSocket client',
      expected: 'Customer UI updates instantly when their position advances',
    },
    {
      id: 'ST-WEB-WAIT-014',
      title: 'Waitlist Analytics: Average Wait Time Today Metric',
      description: 'Verify Owner Analytics displays accurate average queue duration',
      expected: 'Analytics metric calculated from completed waitlist records',
    },
  ],
};
