const { By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = 10000;
  }

  async navigateTo(url) {
    logger.info(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }

  async waitForElement(locator, timeout = this.timeout) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async waitForVisible(locator, timeout = this.timeout) {
    const el = await this.waitForElement(locator, timeout);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    return el;
  }

  async click(locator, timeout = this.timeout) {
    const el = await this.waitForVisible(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(el), timeout);
    await el.click();
  }

  async type(locator, text, timeout = this.timeout) {
    const el = await this.waitForVisible(locator, timeout);
    await el.clear();
    await el.sendKeys(text);
  }

  async getText(locator, timeout = this.timeout) {
    const el = await this.waitForVisible(locator, timeout);
    return await el.getText();
  }

  async isElementPresent(locator, timeout = 3000) {
    try {
      await this.driver.wait(until.elementLocated(locator), timeout);
      return true;
    } catch (e) {
      return false;
    }
  }

  async takeScreenshot(testId) {
    try {
      const screenshotDir = path.join(__dirname, '..', '..', '..', 'test-reports', 'screenshots', 'web');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testId}_${timestamp}.png`;
      const fullPath = path.join(screenshotDir, filename);

      const image = await this.driver.takeScreenshot();
      fs.writeFileSync(fullPath, image, 'base64');
      logger.info(`📸 Screenshot captured: ${fullPath}`);
      return fullPath;
    } catch (e) {
      logger.error('Failed to capture screenshot:', e);
      return '';
    }
  }
}

module.exports = BasePage;
