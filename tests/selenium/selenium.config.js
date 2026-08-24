const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const config = {
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  apiUrl: process.env.API_URL || 'http://localhost:5000/api',
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TIMEOUT || '10000', 10),
  viewport: { width: 1366, height: 768 }
};

async function createDriver() {
  const options = new chrome.Options();
  if (config.headless) {
    options.addArguments('--headless=new');
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    `--window-size=${config.viewport.width},${config.viewport.height}`
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: 2000, pageLoad: 15000, script: 10000 });
  return driver;
}

module.exports = {
  config,
  createDriver
};
