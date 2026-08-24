/**
 * Intelligent Food Preparation Timing Service
 * 
 * Synchronizes kitchen prep with customer arrival and table availability:
 * Target: Customer arrives -> Table is ready -> Food arrives freshly prepared.
 */
function calculateIntelligentPrepTiming({
  travelTimeMinutes = 15,
  tableWaitTimeMinutes = 0,
  items = []
}) {
  // 1. Calculate maximum food preparation time among ordered items
  let maxItemPrepTime = 15; // default 15m
  if (items && items.length > 0) {
    const prepTimes = items.map(item => Number(item.prep_time_minutes || item.prepTime || 15));
    maxItemPrepTime = Math.max(...prepTimes);
  }

  // 2. Customer expected seating time = Max(travelTime, tableWaitTime)
  const expectedSeatingTime = Math.max(travelTimeMinutes, tableWaitTimeMinutes);

  // 3. Recommended prep start delay:
  // We want food ready at expectedSeatingTime + 5 mins (after customer settles in)
  const targetReadyTime = expectedSeatingTime + 5;
  const startDelayMinutes = Math.max(0, targetReadyTime - maxItemPrepTime);

  // 4. Status determination
  let immediatePrepRequired = startDelayMinutes <= 2;

  return {
    travelTimeMinutes,
    tableWaitTimeMinutes,
    maxFoodPrepTimeMinutes: maxItemPrepTime,
    expectedCustomerSeatedInMinutes: expectedSeatingTime,
    recommendedPrepStartDelayMinutes: startDelayMinutes,
    immediatePrepRequired,
    estimatedFoodReadyInMinutes: startDelayMinutes + maxItemPrepTime,
    summary: immediatePrepRequired
      ? 'Start preparation immediately for on-time arrival.'
      : `Schedule preparation to start in ${startDelayMinutes} minutes.`
  };
}

module.exports = {
  calculateIntelligentPrepTiming
};
