/**
 * Suite 02: Restaurant Discovery, Search & Filters
 * 18 Test Cases
 */
module.exports = {
  suiteId: 'WEB-DISC-02',
  suiteName: 'Restaurant Discovery & Filters',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-DISC-001',
      title: 'Render Restaurant Listing Grid',
      description: 'Navigate to Explore Restaurants page and verify restaurant cards load',
      expected: 'Restaurant cards render with images, names, cuisines, and ratings',
    },
    {
      id: 'ST-WEB-DISC-002',
      title: 'Real-Time Restaurant Search by Name',
      description: 'Type "Sangeetha" in the search input and verify filtered results',
      expected: 'Only Sangeetha Veg Gourmet appears in the filtered list',
    },
    {
      id: 'ST-WEB-DISC-003',
      title: 'Search by Cuisine Category (North Indian)',
      description: 'Filter by cuisine tag "North Indian"',
      expected: 'Restaurants serving North Indian cuisine are displayed',
    },
    {
      id: 'ST-WEB-DISC-004',
      title: 'Search by Cuisine Category (Chinese)',
      description: 'Filter by cuisine tag "Chinese"',
      expected: 'Mainland China and relevant Chinese restaurants are displayed',
    },
    {
      id: 'ST-WEB-DISC-005',
      title: 'Search by Cuisine Category (Italian)',
      description: 'Filter by cuisine tag "Italian"',
      expected: 'Toscano and relevant Italian restaurants are displayed',
    },
    {
      id: 'ST-WEB-DISC-006',
      title: 'Pure Vegetarian Toggle Filter',
      description: 'Activate "Pure Veg" switch in search filters',
      expected: 'Only pure vegetarian restaurants are shown in the grid',
    },
    {
      id: 'ST-WEB-DISC-007',
      title: 'Sort by Highest Rating',
      description: 'Select "Highest Rated" from the sorting dropdown',
      expected: 'Restaurants are sorted in descending order of average rating',
    },
    {
      id: 'ST-WEB-DISC-008',
      title: 'Sort by Price: Low to High',
      description: 'Select "Price: Low to High" from the sorting dropdown',
      expected: 'Restaurants ordered by cost-for-two ascending',
    },
    {
      id: 'ST-WEB-DISC-009',
      title: 'Sort by Price: High to Low',
      description: 'Select "Price: High to Low" from the sorting dropdown',
      expected: 'Restaurants ordered by cost-for-two descending',
    },
    {
      id: 'ST-WEB-DISC-010',
      title: 'Location / City Filter Selection',
      description: 'Filter restaurants by neighborhood / area',
      expected: 'Only restaurants matching the selected area are displayed',
    },
    {
      id: 'ST-WEB-DISC-011',
      title: 'Open Now / Available Today Filter',
      description: 'Filter by operating hours and current availability',
      expected: 'Only open restaurants with active booking slots are shown',
    },
    {
      id: 'ST-WEB-DISC-012',
      title: 'Empty Search State Handling',
      description: 'Type a non-existent search query like "XyzNonExistentRestaurant999"',
      expected: 'Display friendly "No restaurants found" empty state with clear filters button',
    },
    {
      id: 'ST-WEB-DISC-013',
      title: 'Clear All Active Filters',
      description: 'Click "Reset Filters" and verify all search params return to default',
      expected: 'Full restaurant catalogue is restored',
    },
    {
      id: 'ST-WEB-DISC-014',
      title: 'Restaurant Card Badges & Metadata',
      description: 'Verify verified partner badge, price tier, and distance indicator',
      expected: 'All metadata chips render with correct styling and icons',
    },
    {
      id: 'ST-WEB-DISC-015',
      title: 'Restaurant Card Click Navigation',
      description: 'Click on a restaurant card to open its detail page',
      expected: 'URL updates to /restaurant/:id and detail page loads',
    },
    {
      id: 'ST-WEB-DISC-016',
      title: 'Restaurant Details Page Hero Banner',
      description: 'Verify restaurant name, cover photo, address, and rating badge on detail page',
      expected: 'Hero section displays full restaurant profile information',
    },
    {
      id: 'ST-WEB-DISC-017',
      title: 'Restaurant Detail Page Tabs Navigation',
      description: 'Switch between "Overview", "Menu", "Reviews", and "Info" tabs',
      expected: 'Smooth tab transitions without page reload',
    },
    {
      id: 'ST-WEB-DISC-018',
      title: 'Restaurant Location & Operating Hours Panel',
      description: 'Verify address, contact phone, and open/close timings on details page',
      expected: 'Operating hours and contact details are displayed accurately',
    },
  ],
};
