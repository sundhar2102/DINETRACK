const path = require('path');

const config = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    'appium:app': process.env.ANDROID_APP_PATH || path.join(__dirname, '..', '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    'appium:appPackage': 'com.smarttable.app',
    'appium:appActivity': '.MainActivity',
    'appium:noReset': true,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 120
  }
};

module.exports = config;
