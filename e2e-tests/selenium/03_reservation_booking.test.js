/**
 * Suite 03: Reservation Engine & Slot Availability
 * 20 Test Cases
 */
module.exports = {
  suiteId: 'WEB-RES-03',
  suiteName: 'Reservation Booking Engine',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-RES-001',
      title: 'Render Reservation Widget on Restaurant Details Page',
      description: 'Verify date selector, time slot grid, and party size dropdown',
      expected: 'Reservation widget is loaded with active calendar and slot buttons',
    },
    {
      id: 'ST-WEB-RES-002',
      title: 'Select Valid Future Booking Date',
      description: 'Choose tomorrow date on the booking calendar',
      expected: 'Calendar updates selected date and triggers live slot query',
    },
    {
      id: 'ST-WEB-RES-003',
      title: 'Select Party Size (2 Guests)',
      description: 'Select 2 guests from the party size selector',
      expected: 'Party size set to 2 and compatible 2-4 seater tables queried',
    },
    {
      id: 'ST-WEB-RES-004',
      title: 'Select Party Size (Large Group - 8 Guests)',
      description: 'Select 8 guests from the party size selector',
      expected: 'Compatible large tables or combined table slots queried',
    },
    {
      id: 'ST-WEB-RES-005',
      title: 'Display Live Time Slots Grid (Lunch & Dinner)',
      description: 'Verify available slots are categorized by Lunch and Dinner sessions',
      expected: 'Time slots rendered with available badges (e.g. 12:30 PM, 07:30 PM)',
    },
    {
      id: 'ST-WEB-RES-006',
      title: 'Slot Selection State Update',
      description: 'Click on 07:30 PM time slot',
      expected: 'Selected slot is highlighted with active brand styling',
    },
    {
      id: 'ST-WEB-RES-007',
      title: 'Dynamic Estimated Wait Time Display',
      description: 'Verify estimated wait time calculation on reservation summary',
      expected: 'Displays "Estimated Wait Time: 0-5 mins" for confirmed bookings',
    },
    {
      id: 'ST-WEB-RES-008',
      title: 'Special Requests & Dietary Notes Input',
      description: 'Enter special instructions: "Window seat and high chair please"',
      expected: 'Notes saved in reservation payload',
    },
    {
      id: 'ST-WEB-RES-009',
      title: 'Guest Contact Info Auto-Fill for Authenticated User',
      description: 'Verify name, email, and phone are auto-populated from user session',
      expected: 'Customer details populated in contact fields',
    },
    {
      id: 'ST-WEB-RES-010',
      title: 'Proceed to Food Pre-Order Step',
      description: 'Click "Add Food Pre-Order" button',
      expected: 'Smooth transition to Step 2: Food Menu Pre-Ordering',
    },
    {
      id: 'ST-WEB-RES-011',
      title: 'Skip Food Pre-Order (Table-Only Reservation)',
      description: 'Click "Skip to Confirmation" without adding food items',
      expected: 'Table reservation created directly with zero pre-order bill',
    },
    {
      id: 'ST-WEB-RES-012',
      title: 'Create Table Reservation with Backend API Confirmation',
      description: 'Submit reservation and receive booking reference number (e.g. RES-XXXX)',
      expected: 'Backend returns 201 Created with unique booking reference and table assignment',
    },
    {
      id: 'ST-WEB-RES-013',
      title: 'Booking Confirmation Screen Rendering',
      description: 'Verify reservation details screen with restaurant, date, time, party size, table number',
      expected: 'Booking confirmed page displays QR code and reference summary',
    },
    {
      id: 'ST-WEB-RES-014',
      title: 'Duplicate Slot Booking Prevention',
      description: 'Attempt to book the exact same table and slot concurrently',
      expected: 'Slot conflict error prevented by transactional table locking',
    },
    {
      id: 'ST-WEB-RES-015',
      title: 'Past Date Booking Prevention',
      description: 'Attempt to select a date in the past',
      expected: 'Past dates disabled on calendar picker',
    },
    {
      id: 'ST-WEB-RES-016',
      title: 'Party Size Exceeding Maximum Restaurant Capacity',
      description: 'Attempt to select a party size greater than largest available table',
      expected: 'Validation prompt: "Contact restaurant directly for parties over 20"',
    },
    {
      id: 'ST-WEB-RES-017',
      title: 'Customer Booking History Feed Update',
      description: 'Navigate to /my-reservations and verify new booking appears at top of feed',
      expected: 'New reservation listed with "CONFIRMED" badge',
    },
    {
      id: 'ST-WEB-RES-018',
      title: 'Customer Cancel Reservation Action',
      description: 'Click "Cancel Reservation" on active booking with confirmation modal',
      expected: 'Status transitions to "CANCELLED" and table is released immediately',
    },
    {
      id: 'ST-WEB-RES-019',
      title: 'Socket.IO Broadcast on New Reservation Creation',
      description: 'Verify restaurant room receives "reservation:created" real-time event',
      expected: 'Owner live dashboard receives socket event without page refresh',
    },
    {
      id: 'ST-WEB-RES-020',
      title: 'Socket.IO Broadcast on Reservation Cancellation',
      description: 'Verify restaurant room receives "reservation:cancelled" real-time event',
      expected: 'Owner live dashboard updates booking status in real-time',
    },
  ],
};
