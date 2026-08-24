/**
 * Suite 13: System Admin Oversight & Platform Operations
 * 12 Test Cases
 */
module.exports = {
  suiteId: 'WEB-ADMIN-13',
  suiteName: 'Admin Operations & Oversight',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-ADMIN-001',
      title: 'Render Admin Dashboard Overview',
      description: 'Navigate to /admin and verify platform-wide KPIs load',
      expected: 'Total Restaurants, Total Diners, Today Platform Bookings, GMV Revenue rendered',
    },
    {
      id: 'ST-WEB-ADMIN-002',
      title: 'View Restaurant Onboarding Approval Queue',
      description: 'Navigate to /admin/approvals and verify list of pending restaurants',
      expected: 'Pending restaurant submissions listed with contact, FSSAI license, and address',
    },
    {
      id: 'ST-WEB-ADMIN-003',
      title: 'Admin Approve Pending Restaurant Submission',
      description: 'Click "APPROVE" on a newly registered restaurant',
      expected: 'Restaurant status updates to APPROVED and listed on public explore page',
    },
    {
      id: 'ST-WEB-ADMIN-004',
      title: 'Admin Reject Incomplete Restaurant Submission',
      description: 'Click "REJECT" with reason note: "Invalid FSSAI documentation"',
      expected: 'Restaurant status updates to REJECTED and owner notified',
    },
    {
      id: 'ST-WEB-ADMIN-005',
      title: 'View All Platform Users & Role Assignment',
      description: 'Navigate to /admin/users and verify user table with roles (CUSTOMER, OWNER, ADMIN)',
      expected: 'User list renders with search, filter, and role badges',
    },
    {
      id: 'ST-WEB-ADMIN-006',
      title: 'Admin Deactivate / Suspend Violating User Account',
      description: 'Click "Suspend Account" on fraudulent user account',
      expected: 'User active flag set to false and active sessions terminated',
    },
    {
      id: 'ST-WEB-ADMIN-007',
      title: 'Platform Commission & Revenue Analytics',
      description: 'Verify 3% platform fee calculations across processed transactions',
      expected: 'Commission analytics displayed with daily, weekly, and monthly charts',
    },
    {
      id: 'ST-WEB-ADMIN-008',
      title: 'System Health & Database Telemetry Dashboard',
      description: 'Check /admin/system-health endpoint status',
      expected: 'Database latency, memory usage, active WebSocket connections reported healthy',
    },
    {
      id: 'ST-WEB-ADMIN-009',
      title: 'Admin Search Across All Platform Bookings',
      description: 'Search globally by booking reference across all partner restaurants',
      expected: 'Global search returns matching booking and linked restaurant',
    },
    {
      id: 'ST-WEB-ADMIN-010',
      title: 'Admin Override Booking Status (Emergency Support)',
      description: 'Admin forces status transition on disputed booking',
      expected: 'Status updated with admin support audit trail entry',
    },
    {
      id: 'ST-WEB-ADMIN-011',
      title: 'Export Platform Audit Logs to Excel',
      description: 'Click "Download Audit Log" in Admin Console',
      expected: 'Audit log workbook generated with timestamp, actor, event, and IP address',
    },
    {
      id: 'ST-WEB-ADMIN-012',
      title: 'Admin Session Expiration & Auto-Lock Security',
      description: 'Verify admin session requires re-authentication after idle timeout',
      expected: 'Session locked securely after inactivity period',
    },
  ],
};
