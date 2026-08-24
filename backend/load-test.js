const autocannon = require('autocannon');
const fs = require('fs');
const { Parser } = require('json2csv');

const URL = 'http://localhost:5000/api/health'; // Test the health endpoint for baseline
const DURATION = 60; // 1 minute
const CONNECTIONS = 300; // 300 virtual users

console.log(`Starting load test against ${URL}...`);
console.log(`Simulating ${CONNECTIONS} concurrent users for ${DURATION} seconds...`);

const instance = autocannon(
  {
    url: URL,
    connections: CONNECTIONS,
    duration: DURATION,
    pipelining: 1,
  },
  console.log
);

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', (result) => {
  console.log('\n--- Load Test Completed ---');
  console.log(`Total Requests: ${result.requests.total}`);
  console.log(`Requests per second (RPS): ${result.requests.average}`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);

  console.log('\n--- Response Times (Latency) ---');
  console.log(`Average: ${result.latency.average} ms`);
  console.log(`Min: ${result.latency.min} ms`);
  console.log(`Max: ${result.latency.max} ms`);
  console.log(`p99 (99% of requests faster than): ${result.latency.p99} ms`);

  // Prepare data for Excel (CSV)
  const csvData = [
    {
      Metric: 'Total Requests',
      Value: result.requests.total,
    },
    {
      Metric: 'Requests per second (Average)',
      Value: result.requests.average,
    },
    {
      Metric: 'Min Latency (ms)',
      Value: result.latency.min,
    },
    {
      Metric: 'Max Latency (ms)',
      Value: result.latency.max,
    },
    {
      Metric: 'Average Latency (ms)',
      Value: result.latency.average,
    },
    {
      Metric: 'p99 Latency (ms)',
      Value: result.latency.p99,
    },
    {
      Metric: 'Total Errors',
      Value: result.errors,
    },
    {
      Metric: 'Total Timeouts',
      Value: result.timeouts,
    },
  ];

  try {
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);
    const filename = 'load-test-results.csv';
    fs.writeFileSync(filename, csv);
    console.log(`\n✅ Results saved to ${filename} (You can open this in Excel)`);
  } catch (err) {
    console.error('Failed to write CSV file', err);
  }
});
