const mobileConfig = require('../config/mobile.config');

class AppiumHelper {
  static getCapabilities() {
    return mobileConfig.capabilities;
  }

  static getDriverOptions() {
    return {
      hostname: mobileConfig.appium.host,
      port: mobileConfig.appium.port,
      path: '/',
      capabilities: mobileConfig.capabilities,
    };
  }

  static getLocators() {
    return {
      // Role Switcher Tabs
      dinerTab: '//android.widget.TextView[@text="Diner"]',
      ownerTab: '//android.widget.TextView[@text="Restaurant Owner"]',

      // Login Inputs & Buttons
      emailInput: '//android.widget.EditText[contains(@hint, "email")]',
      passwordInput: '//android.widget.EditText[contains(@hint, "••••")]',
      signInDinerBtn: '//android.widget.Button[@text="SIGN IN AS DINER"]',
      signInOwnerBtn: '//android.widget.Button[@text="SIGN IN AS RESTAURANT OWNER"]',

      // Customer Screens
      restaurantList: '//android.widget.ScrollView//android.view.View',
      reserveTableBtn: '//android.widget.Button[contains(@text, "Reserve")]',
      foodPreOrderSection: '//android.widget.TextView[contains(@text, "Food Pre-Order")]',
      payOnlineBtn: '//android.widget.Button[contains(@text, "Pay Online")]',

      // Owner Screens
      ownerDashboardHeader: '//android.widget.TextView[contains(@text, "Partner")]',
      overviewTab: '//android.widget.TextView[@text="Overview"]',
      bookingsTab: '//android.widget.TextView[@text="Bookings"]',
      tablesTab: '//android.widget.TextView[@text="Tables"]',
      menuTab: '//android.widget.TextView[@text="Menu"]',
      profileTab: '//android.widget.TextView[@text="Profile"]',
      confirmBookingBtn: '//android.widget.Button[@text="CONFIRM"]',
      addTableBtn: '//android.widget.Button[contains(@text, "Add Table")]',
    };
  }
}

module.exports = AppiumHelper;
