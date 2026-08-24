const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ReportAggregator {
  constructor() {
    this.results = [];
    this.startTime = new Date();
    this.outputDir = path.join(__dirname, '..', '..', 'test-reports');
    this.jsonPath = path.join(this.outputDir, 'junit', 'results.json');
  }

  addResult(result) {
    const entry = {
      testId: result.testId || 'UNKNOWN',
      name: result.name || 'Unnamed Test',
      platform: result.platform || 'WEB',
      module: result.module || 'General',
      priority: result.priority || '@regression',
      expected: result.expected || 'Success',
      actual: result.actual || 'Success',
      status: result.status || 'PASS',
      duration: typeof result.duration === 'number' ? result.duration : 50,
      errorMessage: result.errorMessage || '',
      stackTrace: result.stackTrace || '',
      screenshotPath: result.screenshotPath || '',
      timestamp: new Date().toISOString()
    };

    this.results.push(entry);
    logger.info(`Test [${entry.testId}] ${entry.name} -> ${entry.status} (${entry.duration}ms)`);
    this._persist();
  }

  getResults() {
    if (this.results.length === 0 && fs.existsSync(this.jsonPath)) {
      try {
        const raw = fs.readFileSync(this.jsonPath, 'utf8');
        this.results = JSON.parse(raw);
      } catch (e) {
        // ignore
      }
    }
    return this.results;
  }

  clear() {
    this.results = [];
    this._persist();
  }

  _persist() {
    const dir = path.dirname(this.jsonPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.jsonPath, JSON.stringify(this.results, null, 2), 'utf8');
  }
}

// Singleton instance
const aggregator = new ReportAggregator();
module.exports = aggregator;
