/**
 * Suite M04: Mobile Owner Dashboard (Overview, Bookings, Tables, Menu & Profile)
 * 18 Test Cases
 */
module.exports = {
  suiteId: 'MOB-OWNER-04',
  suiteName: 'Mobile Owner Partner Portal',
  platform: 'Mobile',
  tests: [
    {
      id: 'ST-MOB-OWNER-001',
      title: 'Render Mobile Owner Dashboard with Restaurant KPIs',
      description: 'Log in as owner and verify Overview KPI cards (Today Bookings, Active Tables, Revenue)',
      expected: 'Overview dashboard displays all real-time restaurant performance metrics',
    },
    {
      id: 'ST-MOB-OWNER-002',
      title: 'Table Occupancy Breakdown Widget',
      description: 'Verify visual breakdown counters for Available, Reserved, Occupied, and Cleaning tables',
      expected: 'Counters reflect live state of all restaurant tables',
    },
    {
      id: 'ST-MOB-OWNER-003',
      title: 'Switch to "Bookings" Tab on Owner Mobile Portal',
      description: 'Tap "Bookings" bottom nav tab',
      expected: 'Opens OwnerBookingsScreen with status filters and booking cards feed',
    },
    {
      id: 'ST-MOB-OWNER-004',
      title: 'Filter Mobile Bookings by Status (Pending / Confirmed / Seated / Cancelled)',
      description: 'Tap each status filter chip',
      expected: 'Booking list filters instantly without page reload',
    },
    {
      id: 'ST-MOB-OWNER-005',
      title: 'Owner Confirm Booking from Mobile Feed',
      description: 'Tap "CONFIRM" on a pending reservation card',
      expected: 'Status updates to CONFIRMED and customer notified via Socket.IO',
    },
    {
      id: 'ST-MOB-OWNER-006',
      title: 'Owner Reject Booking from Mobile Feed',
      description: 'Tap "REJECT" on a pending reservation card with reason',
      expected: 'Status updates to REJECTED and table released',
    },
    {
      id: 'ST-MOB-OWNER-007',
      title: 'Owner Cancel Confirmed Booking from Mobile Feed',
      description: 'Tap "CANCEL" on active confirmed reservation',
      expected: 'Status updates to CANCELLED and linked food order/receipt cancelled',
    },
    {
      id: 'ST-MOB-OWNER-008',
      title: 'Switch to "Tables" Tab on Owner Mobile Portal',
      description: 'Tap "Tables" bottom nav tab',
      expected: 'Opens OwnerTablesScreen with table cards grid and occupancy stats',
    },
    {
      id: 'ST-MOB-OWNER-009',
      title: 'Add New Table from Mobile Modal',
      description: 'Tap "+ Add Table", enter Table Number (e.g. T-9), Capacity (4), Section (AC)',
      expected: 'Table created in database and added to mobile table list',
    },
    {
      id: 'ST-MOB-OWNER-010',
      title: 'Edit Table Capacity from Mobile Sheet',
      description: 'Edit Table T-9 capacity from 4 to 6 seats',
      expected: 'Table capacity updated in database and card updates immediately',
    },
    {
      id: 'ST-MOB-OWNER-011',
      title: 'Toggle Table Status between Available and Cleaning',
      description: 'Tap "Mark Cleaning" / "Mark Available" quick toggle',
      expected: 'Table status transitions and badge color changes',
    },
    {
      id: 'ST-MOB-OWNER-012',
      title: 'Delete Table from Mobile with Confirmation Dialog',
      description: 'Tap Delete on Table T-9',
      expected: 'Table removed from database and list',
    },
    {
      id: 'ST-MOB-OWNER-013',
      title: 'Switch to "Menu" Tab on Owner Mobile Portal',
      description: 'Tap "Menu" bottom nav tab',
      expected: 'Opens OwnerMenuScreen with category tabs and menu items',
    },
    {
      id: 'ST-MOB-OWNER-014',
      title: 'Add New Menu Item from Mobile Modal',
      description: 'Tap "+ Add Item", enter Dish Name, Category, Price, Veg flag, and Description',
      expected: 'Dish saved in database and appears in menu list',
    },
    {
      id: 'ST-MOB-OWNER-015',
      title: 'Toggle In-Stock / Availability Switch from Mobile Menu',
      description: 'Toggle switch on dish card',
      expected: 'Item marked Out of Stock / In Stock immediately',
    },
    {
      id: 'ST-MOB-OWNER-016',
      title: 'Edit Dish Price from Mobile Menu Card',
      description: 'Update dish price',
      expected: 'Price updated in database and displayed on card',
    },
    {
      id: 'ST-MOB-OWNER-017',
      title: 'Switch to "Profile" Tab on Owner Mobile Portal',
      description: 'Tap "Profile" bottom nav tab',
      expected: 'Opens OwnerProfileScreen with verified partner banner and restaurant info',
    },
    {
      id: 'ST-MOB-OWNER-018',
      title: 'Owner Logout with Clean Storage Clearance',
      description: 'Tap "LOG OUT PARTNER SESSION" and confirm',
      expected: 'Clears owner auth keys and returns to Unified Login Screen',
    },
  ],
};
