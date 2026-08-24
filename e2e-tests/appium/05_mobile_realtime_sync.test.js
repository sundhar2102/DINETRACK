/**
 * Suite M05: Mobile ↔ Web Real-Time Synchronization & Multi-Device Parity
 * 14 Test Cases
 */
module.exports = {
  suiteId: 'MOB-SYNC-05',
  suiteName: 'Mobile ↔ Web Real-Time Synchronization',
  platform: 'Mobile',
  tests: [
    {
      id: 'ST-MOB-SYNC-001',
      title: 'Web Owner Confirms Booking -> Mobile Customer Receives Real-Time Update',
      description: 'Owner confirms reservation on Web dashboard',
      expected: 'Mobile customer receives push/socket alert and status badge updates to CONFIRMED',
    },
    {
      id: 'ST-MOB-SYNC-002',
      title: 'Mobile Customer Cancels Booking -> Web Step 1 & Step 3 Update Instantly',
      description: 'Customer cancels from Mobile app',
      expected: 'Web Owner Step 1 marks CANCELLED and Step 3 KDS order card is dismissed',
    },
    {
      id: 'ST-MOB-SYNC-003',
      title: 'Web Owner Updates Table Status -> Mobile Owner App Reflects Table Status',
      description: 'Owner marks table Occupied on Web dashboard',
      expected: 'Mobile Owner Tables screen updates badge to OCCUPIED in real-time',
    },
    {
      id: 'ST-MOB-SYNC-004',
      title: 'Mobile Owner Adds Table -> Web Owner Floor Grid Renders New Table',
      description: 'Owner adds Table T-15 on Mobile app',
      expected: 'Web Owner Tables view displays Table T-15 without manual refresh',
    },
    {
      id: 'ST-MOB-SYNC-005',
      title: 'Web Owner Updates Dish Price -> Mobile Customer Menu Shows Updated Price',
      description: 'Owner modifies dish price on Web',
      expected: 'Mobile menu displays updated price immediately',
    },
    {
      id: 'ST-MOB-SYNC-006',
      title: 'Mobile Owner Toggles Dish Out-of-Stock -> Mobile Customer Menu Disables Item',
      description: 'Owner marks dish Sold Out on Mobile Partner app',
      expected: 'Customer mobile ordering disables item with Out of Stock badge',
    },
    {
      id: 'ST-MOB-SYNC-007',
      title: 'Customer Completes Mobile Payment -> Web Owner Receives Payment Alert',
      description: 'Customer pays online from Mobile app',
      expected: 'Web owner dashboard receives "payment:received" notification and receipt marked PAID',
    },
    {
      id: 'ST-MOB-SYNC-008',
      title: 'Web Owner Cancels Paid Booking -> Mobile Customer Receives Refund Notification',
      description: 'Owner cancels paid booking on Web',
      expected: 'Mobile customer receives "Refund Initiated" alert with refund tracking ID',
    },
    {
      id: 'ST-MOB-SYNC-009',
      title: 'Mobile App Backgrounding & Foreground Reconnection',
      description: 'Send mobile app to background for 30s and bring back to foreground',
      expected: 'Socket.IO client re-establishes connection and syncs latest delta state',
    },
    {
      id: 'ST-MOB-SYNC-010',
      title: 'Multi-Device Simultaneous Login with Same Customer Account',
      description: 'Log into Customer account on both Mobile and Web simultaneously',
      expected: 'Both devices stay synchronized with active reservations and booking history',
    },
    {
      id: 'ST-MOB-SYNC-011',
      title: 'Multi-Device Simultaneous Login with Same Owner Account',
      description: 'Log into Owner account on both Mobile and Web simultaneously',
      expected: 'Live KDS and table layout updates broadcast to both screens in tandem',
    },
    {
      id: 'ST-MOB-SYNC-012',
      title: 'Cross-Device Notification Bell Badge Increment',
      description: 'Trigger system notification for customer',
      expected: 'Notification bell unread count increments on both Mobile and Web',
    },
    {
      id: 'ST-MOB-SYNC-013',
      title: 'Data Consistency Check on Itemized Receipt Totals Across Web & Mobile',
      description: 'Compare receipt subtotal, GST, and grand total between Web and Mobile views',
      expected: 'Exact rupee-for-rupee match across all financial line items',
    },
    {
      id: 'ST-MOB-SYNC-014',
      title: 'Socket.IO Transport Fallback (WebSocket -> Polling)',
      description: 'Simulate WebSocket upgrade failure and fallback to long-polling',
      expected: 'Real-time updates continue functioning over HTTP long-polling transport',
    },
  ],
};
