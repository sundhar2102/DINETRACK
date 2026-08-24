const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class RestaurantPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.restaurantName = By.css('h1, [data-testid="restaurant-title"]');
    this.reserveTableButton = By.css('button[data-testid="reserve-btn"], a[href*="/reserve"], button:has-text("Reserve")');
    this.menuTab = By.xpath('//button[contains(text(), "Menu") or contains(text(), "Dishes")]');
    this.reviewsTab = By.xpath('//button[contains(text(), "Reviews")]');
    this.tablesTab = By.xpath('//button[contains(text(), "Tables")]');
    this.menuItems = By.css('[data-testid="menu-item-card"], .menu-item');
  }

  async clickReserveTable() {
    await this.click(this.reserveTableButton);
  }

  async getTitle() {
    return await this.getText(this.restaurantName);
  }
}

class ReservationPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.guestCountInput = By.css('input[type="number"][name="guests"], [data-testid="guest-count"]');
    this.datePicker = By.css('input[type="date"], [data-testid="res-date"]');
    this.timeSlots = By.css('[data-testid="time-slot"], .time-slot-btn, button[class*="slot"]');
    this.submitBookingButton = By.css('button[type="submit"], [data-testid="confirm-booking-btn"], button:has-text("Confirm Booking")');
    this.confirmationBadge = By.css('[data-testid="booking-confirmed"], .text-emerald-500, .bg-emerald-500');
  }

  async createBooking(guests = 2, slotIndex = 0) {
    if (await this.isElementPresent(this.guestCountInput)) {
      await this.type(this.guestCountInput, guests.toString());
    }
    const slots = await this.driver.findElements(this.timeSlots);
    if (slots.length > slotIndex) {
      await slots[slotIndex].click();
    }
    if (await this.isElementPresent(this.submitBookingButton)) {
      await this.click(this.submitBookingButton);
    }
  }
}

class MenuPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addToCartButtons = By.css('button[data-testid="add-to-cart"], button:has-text("Add")');
    this.cartDrawer = By.css('[data-testid="cart-drawer"], .cart-container');
    this.checkoutButton = By.css('button[data-testid="checkout-btn"], button:has-text("Checkout")');
  }

  async addFirstItemToCart() {
    const btns = await this.driver.findElements(this.addToCartButtons);
    if (btns.length > 0) {
      await btns[0].click();
    }
  }
}

class OwnerDashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.dashboardTitle = By.css('h1, [data-testid="owner-header"]');
    this.tabReservations = By.xpath('//button[contains(text(), "Reservations") or contains(text(), "Bookings")]');
    this.tabTables = By.xpath('//button[contains(text(), "Tables") or contains(text(), "Seating")]');
    this.tabKDS = By.xpath('//button[contains(text(), "Kitchen") or contains(text(), "KDS") or contains(text(), "Orders")]');
    this.tabMenu = By.xpath('//button[contains(text(), "Menu")]');
    this.confirmBookingBtn = By.css('button[data-testid="confirm-res-btn"], button:has-text("Confirm")');
    this.rejectBookingBtn = By.css('button[data-testid="reject-res-btn"], button:has-text("Reject")');
  }

  async switchTab(tabLocator) {
    await this.click(tabLocator);
  }
}

class NavigationPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.navBrandLogo = By.css('a[href="/"], .brand-logo');
    this.navProfile = By.css('[data-testid="nav-profile"], .profile-avatar');
    this.navLogout = By.css('button[data-testid="nav-logout"], button:has-text("Logout")');
  }

  async logout() {
    if (await this.isElementPresent(this.navLogout)) {
      await this.click(this.navLogout);
    }
  }
}

module.exports = {
  RestaurantPage,
  ReservationPage,
  MenuPage,
  OwnerDashboardPage,
  NavigationPage
};
