/**
 * Suite M02: Mobile Restaurant Feed, Search & Details Exploration
 * 16 Test Cases
 */
module.exports = {
  suiteId: 'MOB-DISC-02',
  suiteName: 'Mobile Restaurant Discovery',
  platform: 'Mobile',
  tests: [
    {
      id: 'ST-MOB-DISC-001',
      title: 'Render Customer Home Header & Location Selector',
      description: 'Verify current location header, search bar, and notification bell icon',
      expected: 'Customer Home Screen header renders with greeting and location badge',
    },
    {
      id: 'ST-MOB-DISC-002',
      title: 'Render Cuisine Category Chips Carousel',
      description: 'Verify horizontal category chips (North Indian, Chinese, Italian, Desserts, etc.)',
      expected: 'Scrollable cuisine chips render with icons and active filter states',
    },
    {
      id: 'ST-MOB-DISC-003',
      title: 'Filter Mobile Feed by Cuisine Tag',
      description: 'Tap "Chinese" cuisine chip',
      expected: 'Feed filters immediately to display Chinese restaurants (e.g. Mainland China)',
    },
    {
      id: 'ST-MOB-DISC-004',
      title: 'Live Search Input on Mobile Feed',
      description: 'Type "Toscano" in mobile search bar',
      expected: 'Search results list displays matching Toscano Italian restaurant',
    },
    {
      id: 'ST-MOB-DISC-005',
      title: 'Pure Vegetarian Toggle Switch on Mobile',
      description: 'Toggle "Pure Veg" switch in mobile filters',
      expected: 'Feed displays only 100% vegetarian restaurants (e.g. Sangeetha Veg Gourmet)',
    },
    {
      id: 'ST-MOB-DISC-006',
      title: 'Pull-to-Refresh Gesture on Restaurant Feed',
      description: 'Perform downward swipe to refresh restaurant catalogue',
      expected: 'Refreshes live data from /api/restaurants and updates feed smoothly',
    },
    {
      id: 'ST-MOB-DISC-007',
      title: 'Restaurant Card Tap Navigation',
      description: 'Tap on Sangeetha Veg Gourmet card in feed',
      expected: 'Opens Restaurant Detail Screen with hero image and booking widget',
    },
    {
      id: 'ST-MOB-DISC-008',
      title: 'Render Mobile Restaurant Detail Hero & Gallery',
      description: 'Verify restaurant photo, name, address, cuisine badges, and rating',
      expected: 'Detail screen displays full restaurant profile and metadata',
    },
    {
      id: 'ST-MOB-DISC-009',
      title: 'Browse Menu Tab on Mobile Detail Screen',
      description: 'Tap "Menu" tab and scroll through categorized dishes',
      expected: 'Menu items render with prices, veg/non-veg tags, and "ADD" buttons',
    },
    {
      id: 'ST-MOB-DISC-010',
      title: 'Browse Reviews Tab on Mobile Detail Screen',
      description: 'Tap "Reviews" tab and view customer ratings',
      expected: 'Customer reviews list with star ratings and comments',
    },
    {
      id: 'ST-MOB-DISC-011',
      title: 'Call Restaurant Action from Mobile Info Tab',
      description: 'Tap phone number button on restaurant info card',
      expected: 'Triggers system dialer intent with restaurant contact number',
    },
    {
      id: 'ST-MOB-DISC-012',
      title: 'Open Map Navigation Intent',
      description: 'Tap "Get Directions" button on restaurant info card',
      expected: 'Triggers Google Maps intent with restaurant GPS coordinates',
    },
    {
      id: 'ST-MOB-DISC-013',
      title: 'Bottom Navigation Bar Switching (Home / Bookings / Profile)',
      description: 'Tap "My Bookings" and "Profile" bottom nav icons',
      expected: 'Smooth screen transitions across bottom navigation tabs',
    },
    {
      id: 'ST-MOB-DISC-014',
      title: 'Empty State when No Restaurants Match Filters',
      description: 'Enter unmatched search query on mobile',
      expected: 'Displays "No restaurants found" illustration and reset filter button',
    },
    {
      id: 'ST-MOB-DISC-015',
      title: 'Favorite / Bookmark Restaurant Toggle',
      description: 'Tap heart icon on restaurant card',
      expected: 'Toggles saved status and adds to user saved list',
    },
    {
      id: 'ST-MOB-DISC-016',
      title: 'Mobile Performance & Smooth 60fps Scrolling',
      description: 'Perform rapid vertical scrolls on restaurant feed',
      expected: 'Zero frame drops or jank; lazy image loading functions properly',
    },
  ],
};
