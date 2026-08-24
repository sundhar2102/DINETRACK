const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class HomePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.searchInput = By.css('input[placeholder*="Search" i], input[data-testid="search-input"]');
    this.restaurantCards = By.css('[data-testid="restaurant-card"], .restaurant-card, a[href*="/restaurant/"]');
    this.pureVegFilter = By.css('input[type="checkbox"][name="veg"], button[data-testid="veg-toggle"], button:has-text("Veg")');
    this.cuisineChips = By.css('.cuisine-chip, [data-testid="cuisine-chip"]');
  }

  async searchRestaurant(name) {
    await this.type(this.searchInput, name);
  }

  async getRestaurantCount() {
    await this.waitForElement(this.restaurantCards, 5000);
    const elements = await this.driver.findElements(this.restaurantCards);
    return elements.length;
  }

  async selectFirstRestaurant() {
    const el = await this.waitForVisible(this.restaurantCards);
    await el.click();
  }
}

module.exports = HomePage;
