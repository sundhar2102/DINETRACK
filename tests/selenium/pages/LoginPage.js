const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"], input[name="email"], input[placeholder*="email" i], input[data-testid="login-email"]');
    this.passwordInput = By.css('input[type="password"], input[name="password"], input[data-testid="login-password"]');
    this.submitButton = By.css('button[type="submit"], button[data-testid="login-submit"]');
    this.roleSwitchDiner = By.xpath('//button[contains(text(), "Diner") or contains(text(), "Customer")]');
    this.roleSwitchOwner = By.xpath('//button[contains(text(), "Restaurant Owner") or contains(text(), "Partner")]');
    this.errorMessage = By.css('.text-red-500, .bg-red-500, [role="alert"], .error-message');
    this.headerTitle = By.css('h1, h2');
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  async switchToOwnerTab() {
    if (await this.isElementPresent(this.roleSwitchOwner)) {
      await this.click(this.roleSwitchOwner);
    }
  }

  async switchToDinerTab() {
    if (await this.isElementPresent(this.roleSwitchDiner)) {
      await this.click(this.roleSwitchDiner);
    }
  }

  async getErrorMessage() {
    if (await this.isElementPresent(this.errorMessage)) {
      return await this.getText(this.errorMessage);
    }
    return '';
  }
}

module.exports = LoginPage;
