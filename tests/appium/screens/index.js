const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

class BaseScreen {
  constructor(driver) {
    this.driver = driver;
    this.timeout = 10000;
  }

  async findElement(selector, timeout = this.timeout) {
    if (this.driver && this.driver.$) {
      const el = await this.driver.$(selector);
      await el.waitForExist({ timeout });
      return el;
    }
    return null;
  }

  async click(selector, timeout = this.timeout) {
    const el = await this.findElement(selector, timeout);
    if (el) await el.click();
  }

  async setValue(selector, value, timeout = this.timeout) {
    const el = await this.findElement(selector, timeout);
    if (el) {
      await el.clearValue();
      await el.setValue(value);
    }
  }

  async getText(selector, timeout = this.timeout) {
    const el = await this.findElement(selector, timeout);
    if (el) return await el.getText();
    return '';
  }

  async takeScreenshot(testId) {
    try {
      const screenshotDir = path.join(__dirname, '..', '..', '..', 'test-reports', 'screenshots', 'mobile');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testId}_${timestamp}.png`;
      const fullPath = path.join(screenshotDir, filename);

      if (this.driver && this.driver.saveScreenshot) {
        await this.driver.saveScreenshot(fullPath);
      }
      logger.info(`📸 Mobile Screenshot captured: ${fullPath}`);
      return fullPath;
    } catch (e) {
      logger.error('Failed to capture mobile screenshot:', e);
      return '';
    }
  }
}

class LoginScreen extends BaseScreen {
  constructor(driver) {
    super(driver);
    this.emailField = '~login_email_input';
    this.passwordField = '~login_password_input';
    this.signInButton = '~login_submit_btn';
    this.dinerTab = '~role_tab_diner';
    this.ownerTab = '~role_tab_owner';
    this.errorMessage = '~auth_error_banner';
  }

  async login(email, password) {
    await this.setValue(this.emailField, email);
    await this.setValue(this.passwordField, password);
    await this.click(this.signInButton);
  }

  async selectOwnerRole() {
    await this.click(this.ownerTab);
  }

  async selectDinerRole() {
    await this.click(this.dinerTab);
  }
}

class HomeScreen extends BaseScreen {
  constructor(driver) {
    super(driver);
    this.restaurantCard = '~restaurant_card';
    this.searchBar = '~home_search_bar';
    this.categoryChips = '~category_chip';
    this.bottomNavReservations = '~bottom_nav_reservations';
    this.bottomNavProfile = '~bottom_nav_profile';
  }

  async searchRestaurant(name) {
    await this.setValue(this.searchBar, name);
  }

  async openFirstRestaurant() {
    await this.click(this.restaurantCard);
  }
}

class OwnerDashboardScreen extends BaseScreen {
  constructor(driver) {
    super(driver);
    this.tabOverview = '~owner_nav_overview';
    this.tabBookings = '~owner_nav_bookings';
    this.tabTables = '~owner_nav_tables';
    this.tabMenu = '~owner_nav_menu';
    this.tabProfile = '~owner_nav_profile';
    this.confirmBookingBtn = '~owner_confirm_booking_btn';
    this.rejectBookingBtn = '~owner_reject_booking_btn';
  }
}

module.exports = {
  BaseScreen,
  LoginScreen,
  HomeScreen,
  OwnerDashboardScreen
};
