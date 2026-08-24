const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/web.config');

class SeleniumHelper {
  static async createDriver(options = {}) {
    const chromeOpts = new chrome.Options();
    if (config.chromeOptions.headless && options.headless !== false) {
      chromeOpts.addArguments('--headless=new');
    }
    config.chromeOptions.args.forEach((arg) => chromeOpts.addArguments(arg));

    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOpts)
      .build();

    await driver.manage().setTimeouts({
      implicit: config.timeouts.implicit,
      pageLoad: config.timeouts.pageLoad,
    });

    return driver;
  }

  static async waitForElement(driver, locator, timeout = config.timeouts.element) {
    return await driver.wait(until.elementLocated(locator), timeout);
  }

  static async waitForVisible(driver, locator, timeout = config.timeouts.element) {
    const el = await this.waitForElement(driver, locator, timeout);
    await driver.wait(until.elementIsVisible(el), timeout);
    return el;
  }

  static async clickWhenClickable(driver, locator, timeout = config.timeouts.element) {
    const el = await this.waitForVisible(driver, locator, timeout);
    await driver.wait(until.elementIsEnabled(el), timeout);
    await el.click();
    return el;
  }

  static async safeType(driver, locator, text, timeout = config.timeouts.element) {
    const el = await this.waitForVisible(driver, locator, timeout);
    await el.clear();
    await el.sendKeys(text);
    return el;
  }

  static async getText(driver, locator, timeout = config.timeouts.element) {
    const el = await this.waitForVisible(driver, locator, timeout);
    return await el.getText();
  }
}

module.exports = SeleniumHelper;
