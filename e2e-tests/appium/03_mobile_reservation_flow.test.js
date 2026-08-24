/**
 * Suite M03: Mobile Reservation Booking, Food Pre-Order & Wait Time
 * 16 Test Cases
 */
module.exports = {
  suiteId: 'MOB-RES-03',
  suiteName: 'Mobile Reservation & Food Pre-Order Flow',
  platform: 'Mobile',
  tests: [
    {
      id: 'ST-MOB-RES-001',
      title: 'Open Mobile Reservation Screen',
      description: 'Tap "RESERVE A TABLE" on restaurant detail screen',
      expected: 'Opens multi-step booking screen with date, time, and party size selectors',
    },
    {
      id: 'ST-MOB-RES-002',
      title: 'Select Booking Date on Mobile Calendar',
      description: 'Pick date from horizontal date strip',
      expected: 'Selected date highlighted and available time slots queried from backend',
    },
    {
      id: 'ST-MOB-RES-003',
      title: 'Select Party Size on Mobile Carousel',
      description: 'Tap "4 Guests" in party size selector',
      expected: 'Party size updated and compatible table slots refreshed',
    },
    {
      id: 'ST-MOB-RES-004',
      title: 'Select Time Slot on Mobile Grid',
      description: 'Tap "07:30 PM" slot chip',
      expected: 'Slot selected with active orange border and checkmark indicator',
    },
    {
      id: 'ST-MOB-RES-005',
      title: 'Estimated Wait Time Calculation Display',
      description: 'Verify dynamic estimated wait time card (e.g. 0-5 mins for advance reservation)',
      expected: 'Estimated wait time card rendered with clock icon and duration badge',
    },
    {
      id: 'ST-MOB-RES-006',
      title: 'Food Pre-Order Section Integration',
      description: 'Verify "Add Food Pre-Order (Optional)" section with food catalog button',
      expected: 'Food pre-order banner allows diner to select items in advance',
    },
    {
      id: 'ST-MOB-RES-007',
      title: 'Add Food Dishes to Mobile Pre-Order Cart',
      description: 'Select 2 items and adjust quantities via "+" and "-" stepper buttons',
      expected: 'Items added with quantities, and bottom sheet displays updated subtotal',
    },
    {
      id: 'ST-MOB-RES-008',
      title: 'Mobile Bill Breakdown Display (Subtotal + GST + Total)',
      description: 'Verify itemized cost summary on reservation confirmation sheet',
      expected: 'Displays Subtotal, 5% GST, and Total Amount accurately',
    },
    {
      id: 'ST-MOB-RES-009',
      title: 'Submit Reservation with Food Pre-Order',
      description: 'Tap "CONFIRM RESERVATION" button',
      expected: 'Creates reservation and order in single transaction, displays success modal',
    },
    {
      id: 'ST-MOB-RES-010',
      title: 'Render Mobile Reservation Details Screen with Bill & Items',
      description: 'Open confirmed booking details screen',
      expected: 'Screen displays Booking Reference, Table, Date, Time, Ordered Food Items, and Bill Breakdown',
    },
    {
      id: 'ST-MOB-RES-011',
      title: 'Mobile Online Payment Option ("Pay Online" Button)',
      description: 'Verify "Pay Online" button is rendered on unpaid reservation details',
      expected: 'Tapping button launches mobile payment checkout sheet',
    },
    {
      id: 'ST-MOB-RES-012',
      title: 'Complete Mobile Online Payment Simulation',
      description: 'Process payment for ₹1,250 order',
      expected: 'Payment status badge transitions from UNPAID to PAID in green',
    },
    {
      id: 'ST-MOB-RES-013',
      title: 'Cancel Reservation from Mobile Details Screen',
      description: 'Tap "Cancel Reservation" with confirmation dialog',
      expected: 'Booking status transitions to CANCELLED and table is released',
    },
    {
      id: 'ST-MOB-RES-014',
      title: 'View Cancelled Reservation in Mobile History',
      description: 'Verify cancelled booking shows red "CANCELLED" badge and disabled action buttons',
      expected: 'Status badge is CANCELLED and refund details displayed if applicable',
    },
    {
      id: 'ST-MOB-RES-015',
      title: 'Add Booking to Device System Calendar Intent',
      description: 'Tap "Add to Calendar" button on confirmed reservation',
      expected: 'Triggers Android Calendar intent with event title, date, time, and restaurant address',
    },
    {
      id: 'ST-MOB-RES-016',
      title: 'Share Booking Details via Android Share Sheet',
      description: 'Tap "Share" button on reservation details',
      expected: 'Launches Android native share sheet with booking reference summary',
    },
  ],
};
