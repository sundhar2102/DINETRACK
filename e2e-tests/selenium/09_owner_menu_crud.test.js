/**
 * Suite 09: Owner Menu Management (Categories, Items, Pricing & Stock)
 * 16 Test Cases
 */
module.exports = {
  suiteId: 'WEB-OWNER-MENU-09',
  suiteName: 'Owner Menu Management & Catalog',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-MENU-001',
      title: 'Render Menu Management Catalog',
      description: 'Navigate to /owner/menu and verify full restaurant menu loads',
      expected: 'Categories and dishes rendered with prices, veg/non-veg tags, and images',
    },
    {
      id: 'ST-WEB-MENU-002',
      title: 'Filter Menu by Category (Starters, Mains, Breads, Desserts, Beverages)',
      description: 'Click category tabs to view dishes in each category',
      expected: 'Only items belonging to active category are displayed',
    },
    {
      id: 'ST-WEB-MENU-003',
      title: 'Add New Menu Item (Full Form Submission)',
      description: 'Click "Add Dish", enter Name, Category, Price, Description, Prep Time, Veg/Non-Veg',
      expected: 'Dish saved in database with 201 Created and appended to menu list',
    },
    {
      id: 'ST-WEB-MENU-004',
      title: 'Menu Item Form Validation - Required Fields',
      description: 'Submit new dish form with missing name or price',
      expected: 'Validation error: "Dish name and price are required"',
    },
    {
      id: 'ST-WEB-MENU-005',
      title: 'Menu Item Form Validation - Invalid Price (Negative or Zero)',
      description: 'Submit new dish with price = -50 or price = 0',
      expected: 'Validation error: "Price must be greater than zero"',
    },
    {
      id: 'ST-WEB-MENU-006',
      title: 'Edit Existing Dish Name and Description',
      description: 'Update dish name from "Special Thali" to "Grand Maharaja Thali"',
      expected: 'Dish updated successfully and reflected in both Owner and Customer menus',
    },
    {
      id: 'ST-WEB-MENU-007',
      title: 'Edit Existing Dish Price',
      description: 'Update price of Paneer Butter Masala from ₹280 to ₹320',
      expected: 'Price updated in database and new orders calculate with updated price',
    },
    {
      id: 'ST-WEB-MENU-008',
      title: 'Toggle Dish Dietary Flag (Veg <-> Non-Veg)',
      description: 'Switch dietary flag from Non-Veg to Veg',
      expected: 'Badge icon changes from red non-veg symbol to green veg symbol',
    },
    {
      id: 'ST-WEB-MENU-009',
      title: 'Toggle In-Stock Availability Switch (Available <-> Sold Out)',
      description: 'Turn off availability switch on "Mango Kulfi"',
      expected: 'Item marked Out of Stock and disabled on customer ordering screen',
    },
    {
      id: 'ST-WEB-MENU-010',
      title: 'Restore In-Stock Availability Switch (Sold Out <-> Available)',
      description: 'Turn on availability switch on "Mango Kulfi"',
      expected: 'Item restored to in-stock and re-enabled on customer menu',
    },
    {
      id: 'ST-WEB-MENU-011',
      title: 'Delete Menu Item with Confirmation Modal',
      description: 'Click Delete on a menu item and confirm dialog',
      expected: 'Item deleted from menu and removed from catalog',
    },
    {
      id: 'ST-WEB-MENU-012',
      title: 'Add New Custom Menu Category',
      description: 'Click "Add Category", enter "Chef Specials" and save',
      expected: 'New category tab created and available for assigning dishes',
    },
    {
      id: 'ST-WEB-MENU-013',
      title: 'Search Dishes in Menu Management by Name',
      description: 'Type "Biryani" in menu search bar',
      expected: 'Filters catalog to display only matching Biryani dishes',
    },
    {
      id: 'ST-WEB-MENU-014',
      title: 'Upload / Update Dish Photo URL',
      description: 'Enter image URL or upload food image for dish card',
      expected: 'Dish image preview updates and persists in database',
    },
    {
      id: 'ST-WEB-MENU-015',
      title: 'Bulk Update Dish Availability',
      description: 'Select multiple items and toggle availability simultaneously',
      expected: 'All selected items updated in batch',
    },
    {
      id: 'ST-WEB-MENU-016',
      title: 'Socket.IO Broadcast of Menu Changes to Customer Apps',
      description: 'Verify customer app receives "menu:updated" real-time event',
      expected: 'Customer menu refreshes availability instantly without reload',
    },
  ],
};
