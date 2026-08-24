/**
 * Calculate the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance (assuming urban travel speed ~ 25 km/h)
 * @param {number} distanceKm Distance in kilometers
 * @returns {number} Travel time in minutes
 */
function estimateTravelTimeMinutes(distanceKm) {
  const avgUrbanSpeedKmh = 25;
  const timeHours = distanceKm / avgUrbanSpeedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);
  return Math.max(5, timeMinutes); // Minimum 5 mins
}

module.exports = {
  calculateHaversineDistance,
  estimateTravelTimeMinutes
};
