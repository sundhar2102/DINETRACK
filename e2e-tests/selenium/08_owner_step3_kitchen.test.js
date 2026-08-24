/**
 * Suite 08: Owner STEP 3 — Kitchen Display System (KDS) & Order Lifecycle
 * 16 Test Cases
 */
module.exports = {
  suiteId: 'WEB-OWNER-KDS-08',
  suiteName: 'Owner Step 3: Kitchen Display System',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-KDS-001',
      title: 'Render Kitchen Display System (KDS) Screen',
      description: 'Navigate to /owner/kitchen and verify active order cards load',
      expected: 'KDS columns (Received / In Preparation / Ready / Served) render properly',
    },
    {
      id: 'ST-WEB-KDS-002',
      title: 'Display Food Order Ticket Metadata',
      description: 'Verify Order ID, Table Number, Guest Name, Order Time, and Elapsed Timer',
      expected: 'Each order card displays complete ticket details',
    },
    {
      id: 'ST-WEB-KDS-003',
      title: 'Display Itemized Dish List on Ticket',
      description: 'Verify Dish Name, Quantity, and Special Cooking Notes on order card',
      expected: 'All ordered items listed with badges and cooking instruction notes',
    },
    {
      id: 'ST-WEB-KDS-004',
      title: 'Transition Order: PENDING -> PREPARING',
      description: 'Click "Start Preparing" on newly received food order ticket',
      expected: 'Order card moves to "In Preparation" column and prep countdown timer begins',
    },
    {
      id: 'ST-WEB-KDS-005',
      title: 'Transition Order: PREPARING -> READY_FOR_PICKUP',
      description: 'Click "Mark Ready" when dishes finish cooking',
      expected: 'Order card moves to "Ready for Pickup" and waiter notification triggered',
    },
    {
      id: 'ST-WEB-KDS-006',
      title: 'Transition Order: READY -> SERVED',
      description: 'Click "Mark Served" when dishes are delivered to table',
      expected: 'Order status updates to SERVED and order moves to completed archive',
    },
    {
      id: 'ST-WEB-KDS-007',
      title: 'Kitchen Real-Time Elapsed Preparation Timer',
      description: 'Verify live timer updates every second showing minutes elapsed since order placement',
      expected: 'Timer increments dynamically with urgency color coding (>15 mins turns amber, >25 mins turns red)',
    },
    {
      id: 'ST-WEB-KDS-008',
      title: 'Filter Kitchen Queue by Preparation Status',
      description: 'Filter KDS feed by "Pending", "Preparing", or "Ready"',
      expected: 'Feed displays only orders matching selected preparation state',
    },
    {
      id: 'ST-WEB-KDS-009',
      title: 'Filter Kitchen Queue by Table Number or Dining Section',
      description: 'Filter orders for Table T-1 or Indoor section',
      expected: 'KDS filters orders belonging to selected table/section',
    },
    {
      id: 'ST-WEB-KDS-010',
      title: 'Add Extra Items to Active Table Order (Add-On Order)',
      description: 'Add 2 Butter Naan and 1 Sweet Lassi to existing table order',
      expected: 'New items appended to table ticket and subtotal updated accordingly',
    },
    {
      id: 'ST-WEB-KDS-011',
      title: 'Cancel Specific Item on Order Ticket with Kitchen Reason',
      description: 'Cancel 1 dish that is out of stock in kitchen',
      expected: 'Item removed from ticket, kitchen alert displayed, and bill recalculated',
    },
    {
      id: 'ST-WEB-KDS-012',
      title: 'Print Kitchen Order Ticket (KOT) Simulation',
      description: 'Click "Print KOT" on order card',
      expected: 'Triggers formatted KOT receipt for physical thermal printer output',
    },
    {
      id: 'ST-WEB-KDS-013',
      title: 'Audio Alert Sound on New Incoming Order',
      description: 'Simulate new order arriving via WebSocket',
      expected: 'Audio notification chime triggered and new ticket animates in queue',
    },
    {
      id: 'ST-WEB-KDS-014',
      title: 'View Active Table Bill and Payment Status from KDS',
      description: 'Click "View Bill" on order card',
      expected: 'Displays live receipt modal with payment status (PAID / UNPAID)',
    },
    {
      id: 'ST-WEB-KDS-015',
      title: 'Collect Payment at Table and Settle Bill',
      description: 'Mark cash / card payment received at table counter',
      expected: 'Bill status transitions to PAID and receipt marked completed',
    },
    {
      id: 'ST-WEB-KDS-016',
      title: 'Socket.IO Synchronization Across Kitchen & Waitstaff Devices',
      description: 'Verify kitchen order updates propagate immediately to staff mobile apps',
      expected: 'Instant two-way sync between Web KDS and Mobile app',
    },
  ],
};
