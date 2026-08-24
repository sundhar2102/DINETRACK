/**
 * Suite 10: Multi-Entity Cancellation, Receipt & Refund Synchronization
 * 16 Test Cases
 */
module.exports = {
  suiteId: 'WEB-SYNC-10',
  suiteName: 'Cancellation, Receipt & Refund Sync',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-SYNC-001',
      title: 'Customer Cancels Reservation with Linked Food Order (Unpaid)',
      description: 'Customer cancels booking before arrival',
      expected: 'Reservation = CANCELLED, Order = CANCELLED, Receipt = CANCELLED, Table = AVAILABLE',
    },
    {
      id: 'ST-WEB-SYNC-002',
      title: 'Owner Cancels Reservation in Step 1 (Linked to Step 3 Kitchen Queue)',
      description: 'Owner cancels booking from Step 1 Reservations feed',
      expected: 'Kitchen order card automatically removed from Step 3 KDS without manual intervention',
    },
    {
      id: 'ST-WEB-SYNC-003',
      title: 'Receipt Status Synchronization on Owner Cancellation',
      description: 'Verify digital bill status switches to "CANCELLED / VOID"',
      expected: 'Receipt reflects voided status and invoice totals zeroed out',
    },
    {
      id: 'ST-WEB-SYNC-004',
      title: 'Table Release Synchronization on Owner Cancellation',
      description: 'Verify table associated with cancelled reservation returns to "AVAILABLE"',
      expected: 'Step 2 floor grid immediately shows table in green Available state',
    },
    {
      id: 'ST-WEB-SYNC-005',
      title: 'Paid Reservation Cancellation & Automatic Refund Initiation',
      description: 'Cancel reservation that had online advance payment of ₹1,250',
      expected: 'Refund record created with REFUND_INITIATED, refund ID generated (RFD-XXXX)',
    },
    {
      id: 'ST-WEB-SYNC-006',
      title: 'Refund Status Verification via Payments API',
      description: 'Verify GET /api/payments/refund/:id returns refund details and original transaction link',
      expected: 'Refund metadata contains original payment_id, refund amount, and timestamp',
    },
    {
      id: 'ST-WEB-SYNC-007',
      title: 'Customer UI Real-Time Notification on Owner Cancellation',
      description: 'Verify customer receives immediate alert: "Your reservation was cancelled by restaurant"',
      expected: 'Customer app displays alert banner and updates reservation details view',
    },
    {
      id: 'ST-WEB-SYNC-008',
      title: 'Owner UI Real-Time Notification on Customer Self-Cancellation',
      description: 'Verify owner Step 1 and Step 3 receive immediate update when diner cancels from mobile',
      expected: 'Step 1 booking updates badge and Step 3 order ticket is dismissed with alert sound',
    },
    {
      id: 'ST-WEB-SYNC-009',
      title: 'Atomic Database Transaction on Multi-Entity Cancellation',
      description: 'Verify SQL transaction rolls back if any entity update fails',
      expected: 'Strict data consistency preserved across reservations, orders, tables, and payments tables',
    },
    {
      id: 'ST-WEB-SYNC-010',
      title: 'Prevent Double Cancellation of Already Cancelled Booking',
      description: 'Attempt to submit cancellation request for an already CANCELLED reservation',
      expected: 'Gracefully rejected: "Reservation is already cancelled"',
    },
    {
      id: 'ST-WEB-SYNC-011',
      title: 'Prevent Cancellation of Completed / Departed Reservation',
      description: 'Attempt to cancel a booking in COMPLETED status',
      expected: 'Action blocked: "Cannot cancel a completed dining session"',
    },
    {
      id: 'ST-WEB-SYNC-012',
      title: 'Partial Item Cancellation within Active Order',
      description: 'Cancel 1 dish out of 4 dishes in kitchen',
      expected: 'Item status = CANCELLED, Order remains ACTIVE, subtotal and bill recalculated',
    },
    {
      id: 'ST-WEB-SYNC-013',
      title: 'Partial Refund Calculation on Item Cancellation',
      description: 'Verify refund amount equals cancelled item price + applicable GST proportion',
      expected: 'Partial refund recorded accurately',
    },
    {
      id: 'ST-WEB-SYNC-014',
      title: 'Socket.IO Room-Specific Broadcasting Security',
      description: 'Verify cancellation socket event is only delivered to the specific restaurant and customer rooms',
      expected: 'No cross-restaurant data leak across WebSocket channels',
    },
    {
      id: 'ST-WEB-SYNC-015',
      title: 'Audit Log Entry on Every Status Cancellation',
      description: 'Verify system audit log records actor (CUSTOMER vs OWNER), reason, and timestamp',
      expected: 'Audit trail entry created in database',
    },
    {
      id: 'ST-WEB-SYNC-016',
      title: 'Mobile App ↔ Web App Status Parity Test',
      description: 'Verify Web app and Mobile app show identical status and receipt details simultaneously',
      expected: '100% data parity between Web and Mobile views',
    },
  ],
};
