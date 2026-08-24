/**
 * Appium Mobile E2E Testing Configuration for Smart Table
 */
const path = require('path');

module.exports = {
  appium: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    baseUrl: 'http://localhost:5000/api',
  },
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
    'appium:app': path.resolve(__dirname, '../../build/app/outputs/flutter-apk/app-debug.apk'),
    'appium:appPackage': 'com.smarttable.app',
    'appium:appActivity': '.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 180,
    'appium:autoGrantPermissions': true,
  },
  timeouts: {
    implicit: 10000,
    elementWait: 15000,
  },
  credentials: {
    customer: {
      email: 'alex@smarttable.com',
      password: 'Password123!',
    },
    owner: {
      email: 'owner@sangeetha.com',
      password: 'Password123!',
    },
  },
};
