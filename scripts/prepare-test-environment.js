const { getDb } = require('../backend/database/db');
const path = require('path');
const fs = require('fs');

async function prepareTestEnvironment() {
  console.log('🔧 Initializing Smart Table test database & environment...');

  const db = await getDb();
  console.log('✅ SQLite Database connection verified.');

  // Ensure directories exist
  const dirs = [
    path.join(__dirname, '..', 'test-reports', 'excel'),
    path.join(__dirname, '..', 'test-reports', 'html'),
    path.join(__dirname, '..', 'test-reports', 'screenshots', 'web'),
    path.join(__dirname, '..', 'test-reports', 'screenshots', 'mobile'),
    path.join(__dirname, '..', 'test-reports', 'logs'),
    path.join(__dirname, '..', 'test-reports', 'junit')
  ];

  dirs.forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  console.log('✅ Test report directories verified.');
  console.log('🚀 Environment ready for automated test execution.\n');
}

if (require.main === module) {
  prepareTestEnvironment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Environment preparation failed:', err);
      process.exit(1);
    });
}

module.exports = { prepareTestEnvironment };
