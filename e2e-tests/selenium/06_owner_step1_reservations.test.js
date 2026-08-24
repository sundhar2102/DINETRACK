/**
 * Suite 06: Owner STEP 1 — Reservations Management
 * 16 Test Cases
 */
module.exports = {
  suiteId: 'WEB-OWNER-RES-06',
  suiteName: 'Owner Step 1: Reservations Management',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-OWNER-001',
      title: 'Render Owner Dashboard Step 1 Reservations Tab',
      description: 'Navigate to /owner/reservations and verify bookings feed',
      expected: 'Reservations table renders with customer name, party size, table, time, and status',
    },
    {
      id: 'ST-WEB-OWNER-002',
      title: 'Filter Reservations by Status (All / Pending / Confirmed / Seated / Cancelled)',
      description: 'Click each status filter chip and verify list filters accurately',
      expected: 'Only reservations matching the active filter chip are displayed',
    },
    {
      id: 'ST-WEB-OWNER-003',
      title: 'Owner Confirm Pending Reservation Action',
      description: 'Click "CONFIRM" on a PENDING booking request',
      expected: 'Reservation status transitions to CONFIRMED and customer receives real-time update',
    },
    {
      id: 'ST-WEB-OWNER-004',
      title: 'Owner Reject Pending Reservation Action',
      description: 'Click "REJECT" on a PENDING booking request with reason modal',
      expected: 'Reservation status transitions to REJECTED and table is released',
    },
    {
      id: 'ST-WEB-OWNER-005',
      title: 'Owner Cancel Confirmed Reservation Action',
      description: 'Click "CANCEL" on an active confirmed reservation',
      expected: 'Status transitions to CANCELLED and linked food order & bill updated',
    },
    {
      id: 'ST-WEB-OWNER-006',
      title: 'Search Reservation by Customer Name or Reference ID',
      description: 'Type "Alex Johnson" or reference ID in search box',
      expected: 'Filtered results show exact matching reservation card',
    },
    {
      id: 'ST-WEB-OWNER-007',
      title: 'Filter Reservations by Date Range (Today / Tomorrow / Custom)',
      description: 'Select "Today" filter to view current session reservations',
      expected: 'Only bookings scheduled for today are displayed',
    },
    {
      id: 'ST-WEB-OWNER-008',
      title: 'View Reservation Details & Special Dietary Instructions',
      description: 'Click on a reservation row to expand detailed view',
      expected: 'Modal / slide-over renders guest phone, dietary notes, and booking source',
    },
    {
      id: 'ST-WEB-OWNER-009',
      title: 'View Linked Food Pre-Order from Step 1 Details',
      description: 'Inspect food pre-order button on reservation details card',
      expected: 'Displays ordered items list, quantities, and bill total',
    },
    {
      id: 'ST-WEB-OWNER-010',
      title: 'Seat Guests Action (CONFIRMED -> SEATED)',
      description: 'Click "SEAT GUEST" when diner arrives at the restaurant',
      expected: 'Status updates to SEATED and Table status transitions to OCCUPIED',
    },
    {
      id: 'ST-WEB-OWNER-011',
      title: 'Complete Reservation Action (SEATED -> COMPLETED)',
      description: 'Click "COMPLETE DINING" after guest finishes dining and pays',
      expected: 'Status updates to COMPLETED and Table status transitions to CLEANING',
    },
    {
      id: 'ST-WEB-OWNER-012',
      title: 'Mark Guest as No-Show',
      description: 'Click "NO SHOW" if guest does not arrive within grace period',
      expected: 'Status updates to NO_SHOW and table released to walk-in waitlist',
    },
    {
      id: 'ST-WEB-OWNER-013',
      title: 'Export Reservations to CSV / Excel',
      description: 'Click "Export Bookings" button in header',
      expected: 'Generates CSV/Excel report of all reservations for selected date range',
    },
    {
      id: 'ST-WEB-OWNER-014',
      title: 'Live Booking Counter Synchronization',
      description: 'Verify Today Bookings metric increments automatically on new booking',
      expected: 'KPI badge increments without manual page refresh',
    },
    {
      id: 'ST-WEB-OWNER-015',
      title: 'Pagination / Infinite Scroll on Long Booking Lists',
      description: 'Scroll through large history of bookings',
      expected: 'Subsequent pages load smoothly without layout jumps',
    },
    {
      id: 'ST-WEB-OWNER-016',
      title: 'Socket.IO Auto-Refresh on External Status Change',
      description: 'Trigger status change via API and verify Step 1 table updates in real-time',
      expected: 'Table row highlights and updates status badge instantly',
    },
  ],
};
