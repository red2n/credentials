import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const bloomFilterErrors = new Rate('bloom_filter_errors');

// Bloom filter stress test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Quick ramp up
    { duration: '2m', target: 200 },   // Heavy load
    { duration: '1m', target: 500 },   // Stress test
    { duration: '2m', target: 500 },   // Sustained stress
    { duration: '1m', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // Very fast responses required
    http_req_failed: ['rate<0.01'],    // Extremely low error rate
    bloom_filter_errors: ['rate<0.005'], // Custom bloom filter error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Generate realistic usernames for testing
const commonPrefixes = ['user', 'admin', 'test', 'dev', 'app', 'sys', 'db', 'api', 'web', 'mobile'];
const commonSuffixes = ['123', '456', '789', '2024', '2025', 'prod', 'dev', 'test', '_1', '_2'];

function generateUsername() {
  const prefix = commonPrefixes[Math.floor(Math.random() * commonPrefixes.length)];
  const suffix = commonSuffixes[Math.floor(Math.random() * commonSuffixes.length)];
  const number = Math.floor(Math.random() * 10000);
  return `${prefix}${number}${suffix}`;
}

export default function () {
  // Generate a random username for testing
  const username = generateUsername();

  // Test Bloom Filter Validation
  const response = http.post(`${API_URL}/username/validate`,
    JSON.stringify({ username: username }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '5s', // Short timeout for stress test
    }
  );

  const success = check(response, {
    'Bloom Filter: status is 200': (r) => r.status === 200,
    'Bloom Filter: response time < 100ms': (r) => r.timings.duration < 100,
    'Bloom Filter: has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.username === username &&
               typeof body.mightExist === 'boolean' &&
               typeof body.message === 'string';
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    bloomFilterErrors.add(1);
  }

  // Very short sleep for maximum throughput
  sleep(0.1);
}

export function setup() {
  console.log('🔍 Starting k6 Bloom Filter stress test');
  console.log(`📊 Target URL: ${BASE_URL}`);
  console.log('⚡ High-throughput username validation testing');

  // Quick health check
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`API not accessible. Status: ${response.status}`);
  }

  console.log('✅ Starting Bloom Filter stress test');
  return { baseUrl: BASE_URL };
}

export function teardown(data) {
  console.log('🏁 Bloom Filter stress test completed');
  console.log('🔍 Username validation performance tested under high load');
}
