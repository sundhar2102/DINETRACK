/**
 * Suite 12: Reviews, Ratings & Customer Feedback
 * 12 Test Cases
 */
module.exports = {
  suiteId: 'WEB-REV-12',
  suiteName: 'Reviews & Customer Ratings',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-REV-001',
      title: 'Render Reviews Section on Restaurant Details Page',
      description: 'Navigate to Reviews tab and verify existing customer ratings load',
      expected: 'Average rating, total reviews count, star breakdown, and review list rendered',
    },
    {
      id: 'ST-WEB-REV-002',
      title: 'Submit New 5-Star Review with Comment',
      description: 'Submit rating = 5, title = "Exceptional Dining!", comment = "Great food and fast service"',
      expected: 'Review created with 201 Created and appended to review feed',
    },
    {
      id: 'ST-WEB-REV-003',
      title: 'Review Form Validation - Star Rating Required',
      description: 'Attempt to submit review with 0 stars selected',
      expected: 'Validation error: "Please select a star rating (1 to 5)"',
    },
    {
      id: 'ST-WEB-REV-004',
      title: 'Review Form Validation - Minimum Comment Length',
      description: 'Submit review with comment shorter than 5 characters',
      expected: 'Validation error: "Review comment must be at least 5 characters"',
    },
    {
      id: 'ST-WEB-REV-005',
      title: 'Real-Time Recalculation of Restaurant Average Rating',
      description: 'Verify restaurant average rating recalculates accurately upon new review',
      expected: 'Average rating updates (e.g. 4.7 to 4.8) and persisted in restaurant record',
    },
    {
      id: 'ST-WEB-REV-006',
      title: 'Verified Diner Badge on Review by Customer with Completed Booking',
      description: 'Verify "Verified Diner" badge displayed on review written after dining',
      expected: 'Review card highlights "Verified Diner" trust badge',
    },
    {
      id: 'ST-WEB-REV-007',
      title: 'Owner View Reviews in Partner Dashboard',
      description: 'Navigate to /owner/reviews and verify list of incoming reviews',
      expected: 'Owner can view all customer feedback sorted by date or rating',
    },
    {
      id: 'ST-WEB-REV-008',
      title: 'Owner Post Official Response to Customer Review',
      description: 'Owner replies: "Thank you for dining with us! We look forward to seeing you again."',
      expected: 'Owner response saved and rendered underneath the customer review card',
    },
    {
      id: 'ST-WEB-REV-009',
      title: 'Filter Reviews by Star Rating (5 Stars, 4 Stars, 3 Stars, etc.)',
      description: 'Click 5-Star filter button on reviews breakdown',
      expected: 'Displays only 5-star reviews',
    },
    {
      id: 'ST-WEB-REV-010',
      title: 'Edit Own Review by Author',
      description: 'Customer edits their existing review comment',
      expected: 'Review updated with "Edited" timestamp indicator',
    },
    {
      id: 'ST-WEB-REV-011',
      title: 'Delete Own Review by Author',
      description: 'Customer deletes their review',
      expected: 'Review removed and restaurant average rating recalculated',
    },
    {
      id: 'ST-WEB-REV-012',
      title: 'Prevent Duplicate Reviews for Same Dining Reservation',
      description: 'Attempt to submit second review for the same completed booking ID',
      expected: 'Prompt: "You have already reviewed this dining experience"',
    },
  ],
};
