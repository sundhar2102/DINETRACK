const fs = require('fs');
const path = require('path');

function countTestsInDir(dirPath) {
  let count = 0;
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      count += countTestsInDir(fullPath);
    } else if (item.endsWith('.test.js') || item.endsWith('.spec.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/id:\s*['"`](WEB-|MOB-|API-)[^'"`]+['"`]/g) || [];
      const itMatches = content.match(/it\s*\(/g) || [];
      count += Math.max(matches.length, itMatches.length);
    }
  }
  return count;
}

function runAudit() {
  console.log('\n==================================================');
  console.log('🔍 SMARTTABLE AUTOMATED TEST AUDIT');
  console.log('==================================================\n');

  const seleniumDir = path.join(__dirname, '..', 'tests', 'selenium', 'tests');
  const appiumDir = path.join(__dirname, '..', 'tests', 'appium', 'tests');
  const apiDir = path.join(__dirname, '..', 'tests', 'api');

  const seleniumCount = countTestsInDir(seleniumDir);
  const appiumCount = countTestsInDir(appiumDir);
  const apiCount = countTestsInDir(apiDir);
  const totalCount = seleniumCount + appiumCount + apiCount;

  console.log(`Selenium Tests : ${seleniumCount}`);
  console.log(`Appium Tests   : ${appiumCount}`);
  console.log(`API Tests      : ${apiCount}\n`);
  console.log(`Total Automated Tests : ${totalCount}`);
  console.log(`Requirement           : Minimum 300 Tests`);

  const passed = totalCount >= 300 && seleniumCount >= 200 && appiumCount >= 100;
  console.log(`Status                : ${passed ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log('==================================================\n');

  if (!passed) {
    process.exit(1);
  }
  return { seleniumCount, appiumCount, apiCount, totalCount };
}

if (require.main === module) {
  runAudit();
}

module.exports = { runAudit };
