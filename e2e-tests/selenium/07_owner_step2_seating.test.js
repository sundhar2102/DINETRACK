/**
 * Suite 07: Owner STEP 2 — Table Layout & Floor Seating Management
 * 16 Test Cases
 */
module.exports = {
  suiteId: 'WEB-OWNER-SEAT-07',
  suiteName: 'Owner Step 2: Table Seating Management',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-SEAT-001',
      title: 'Render Floor Plan Table Grid',
      description: 'Navigate to /owner/tables and verify interactive table cards load',
      expected: 'All restaurant tables rendered with capacity, section, and live status badge',
    },
    {
      id: 'ST-WEB-SEAT-002',
      title: 'Display Status Badges: Available, Reserved, Occupied, Cleaning, Maintenance',
      description: 'Verify color-coded status badges for all table states',
      expected: 'Green for Available, Amber for Reserved, Red for Occupied, Blue for Cleaning',
    },
    {
      id: 'ST-WEB-SEAT-003',
      title: 'Filter Tables by Dining Section (Indoor, Outdoor, Rooftop, AC)',
      description: 'Click section filter tabs and verify grid updates',
      expected: 'Only tables located in the selected section are displayed',
    },
    {
      id: 'ST-WEB-SEAT-004',
      title: 'Filter Tables by Capacity (2-Seater, 4-Seater, 6-Seater, 8+ Seater)',
      description: 'Filter by table size',
      expected: 'Tables matching capacity criteria are filtered accurately',
    },
    {
      id: 'ST-WEB-SEAT-005',
      title: 'Owner Quick Toggle: Available -> Cleaning',
      description: 'Click "Mark Cleaning" on an available table after diner departs',
      expected: 'Table status transitions to CLEANING and table is blocked from new bookings',
    },
    {
      id: 'ST-WEB-SEAT-006',
      title: 'Owner Quick Toggle: Cleaning -> Available',
      description: 'Click "Mark Clean / Ready" on a table in cleaning state',
      expected: 'Table status transitions to AVAILABLE and table is open for bookings',
    },
    {
      id: 'ST-WEB-SEAT-007',
      title: 'Owner Quick Toggle: Maintenance Mode',
      description: 'Mark table as MAINTENANCE for repairs',
      expected: 'Table disabled with maintenance warning banner',
    },
    {
      id: 'ST-WEB-SEAT-008',
      title: 'Add New Restaurant Table Modal',
      description: 'Click "Add Table", fill table number (e.g. T-12), capacity (4), section (Indoor)',
      expected: 'New table created with 201 Created and added to floor grid',
    },
    {
      id: 'ST-WEB-SEAT-009',
      title: 'Duplicate Table Number Prevention',
      description: 'Attempt to create a table with an existing table number in the same restaurant',
      expected: 'Validation error: "A table with this number already exists"',
    },
    {
      id: 'ST-WEB-SEAT-010',
      title: 'Edit Existing Table Details',
      description: 'Modify capacity of Table T-12 from 4 to 6 seats',
      expected: 'Table updated successfully and grid displays new capacity (6 Seats)',
    },
    {
      id: 'ST-WEB-SEAT-011',
      title: 'Delete Inactive Table',
      description: 'Click Delete on an unassigned table with confirmation modal',
      expected: 'Table removed from database and floor grid',
    },
    {
      id: 'ST-WEB-SEAT-012',
      title: 'Prevent Deletion of Table with Active Reservation',
      description: 'Attempt to delete a table currently in RESERVED or OCCUPIED status',
      expected: 'Action blocked with message: "Cannot delete table with active bookings"',
    },
    {
      id: 'ST-WEB-SEAT-013',
      title: 'Real-Time Table Occupancy Percentage Metric',
      description: 'Verify Occupancy Rate KPI = (Occupied Tables / Total Active Tables * 100)',
      expected: 'Occupancy gauge updates dynamically as tables transition states',
    },
    {
      id: 'ST-WEB-SEAT-014',
      title: 'Click Table to View Current Seated Reservation',
      description: 'Click an OCCUPIED table card',
      expected: 'Side drawer shows seated party details, check-in time, and active food order',
    },
    {
      id: 'ST-WEB-SEAT-015',
      title: 'Reassign Reservation to Different Available Table',
      description: 'Move reservation from Table T-1 to Table T-4',
      expected: 'Reservation table_id updated, T-1 becomes Available, T-4 becomes Reserved',
    },
    {
      id: 'ST-WEB-SEAT-016',
      title: 'Socket.IO Real-Time Table Status Broadcast',
      description: 'Trigger status update and verify all connected client screens update instantly',
      expected: 'Table card color and status badge update via WebSocket broadcast',
    },
  ],
};
