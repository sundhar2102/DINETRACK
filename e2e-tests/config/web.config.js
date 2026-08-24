/**
 * Web E2E Testing Configuration for Smart Table
 */
module.exports = {
  baseUrl: process.env.WEB_BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
  timeouts: {
    implicit: 8000,
    pageLoad: 25000,
    element: 10000,
    command: 15000,
  },
  credentials: {
    customer: {
      email: 'alex@smarttable.com',
      password: 'Password123!',
      name: 'Alex Johnson',
    },
    owner: {
      email: 'owner@sangeetha.com',
      password: 'Password123!',
      name: 'Sangeetha Ramanathan',
      restaurantName: 'Sangeetha Veg Gourmet',
      restaurantId: 'rest-001',
    },
    admin: {
      email: 'admin@smarttable.com',
      password: 'Password123!',
      name: 'System Admin',
    },
  },
  chromeOptions: {
    headless: process.env.HEADLESS !== 'false',
    windowSize: { width: 1440, height: 900 },
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
      '--disable-notifications',
    ],
  },
};
