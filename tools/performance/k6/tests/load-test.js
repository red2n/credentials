import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');
export const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '5m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.05'],            // Custom error rate must be below 5%
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test data
const usernames = [
  'testuser1', 'testuser2', 'testuser3', 'admin', 'developer',
  'manager', 'analyst', 'designer', 'architect', 'consultant'
];

const passwords = [
  'password123', 'securepass', 'mypassword', 'admin12345', 'testpass'
];

// Helper function to get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to record metrics
function recordMetrics(response, testName) {
  requestCount.add(1);
  responseTime.add(response.timings.duration);

  const success = check(response, {
    [`${testName}: status is 200`]: (r) => r.status === 200,
    [`${testName}: response time < 500ms`]: (r) => r.timings.duration < 500,
  });

  if (!success) {
    errorRate.add(1);
  }
}

export default function () {
  // Test 1: API Health Check
  let response = http.get(`${BASE_URL}/health`);
  recordMetrics(response, 'Health Check');

  // Test 2: Username Validation (Bloom Filter)
  const username = getRandomElement(usernames);
  response = http.post(`${API_URL}/username/validate`,
    JSON.stringify({ username: username }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  recordMetrics(response, 'Username Validation');

  // Test 3: User Existence Check
  response = http.get(`${API_URL}/auth/check/${username}`);
  recordMetrics(response, 'User Existence Check');

  // Test 4: User Login Attempt
  const password = getRandomElement(passwords);
  response = http.post(`${API_URL}/auth/login`,
    JSON.stringify({ username: username, password: password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(response, {
    'Login: status is 200 or 401': (r) => [200, 401].includes(r.status),
  });

  // Test 5: Database Statistics
  response = http.get(`${API_URL}/auth/stats`);
  recordMetrics(response, 'Database Stats');

  // Test 6: Bloom Filter Statistics
  response = http.get(`${API_URL}/username/stats`);
  recordMetrics(response, 'Bloom Filter Stats');

  // Test 7: Redis Health Check
  response = http.get(`${API_URL}/redis/health`);
  recordMetrics(response, 'Redis Health');

  // Test 8: Redis Statistics
  response = http.get(`${API_URL}/redis/stats`);
  recordMetrics(response, 'Redis Stats');

  // Test 9: Cache Analysis
  response = http.get(`${API_URL}/redis/cache/analysis`);
  recordMetrics(response, 'Cache Analysis');

  // Test 10: Cache Health (Legacy endpoint)
  response = http.get(`${API_URL}/username/cache/health`);
  recordMetrics(response, 'Legacy Cache Health');

  // Wait between requests
  sleep(1);
}

// Setup function - runs once before all tests
export function setup() {
  console.log('🚀 Starting k6 load test for Credentials Management System');
  console.log(`📊 Target URL: ${BASE_URL}`);
  console.log('📈 Test stages: Ramp up to 100 concurrent users over 21 minutes');

  // Verify API is accessible
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`API not accessible. Status: ${response.status}`);
  }

  console.log('✅ API health check passed - starting load test');
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after all tests
export function teardown(data) {
  console.log('🏁 k6 load test completed');
  console.log('📊 Check the summary above for detailed metrics');
}
