import http from 'k6/http';
import { check, sleep } from 'k6';

// Simple load test configuration
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp up to 10 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function() {
  // Test different endpoints with different probabilities
  const rand = Math.random();

  if (rand < 0.5) {
    // 50% - Test username validation (Bloom filter)
    testUsernameValidation();
  } else if (rand < 0.8) {
    // 30% - Test user existence check
    testUserCheck();
  } else {
    // 20% - Test authentication
    testAuth();
  }

  sleep(0.5); // Short sleep between requests
}

function testUsernameValidation() {
  const testUsernames = ['john', 'jane', 'admin', 'test123', 'newuser' + Math.floor(Math.random() * 1000)];
  const username = testUsernames[Math.floor(Math.random() * testUsernames.length)];

  const response = http.post(`${BASE_URL}/username/validate`, JSON.stringify({
    username: username
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'username_validate' }
  });

  check(response, {
    'username validate status 200': (r) => r.status === 200,
    'username validate fast': (r) => r.timings.duration < 100,
  });
}

function testUserCheck() {
  const response = http.get(`${BASE_URL}/auth/check/testuser${Math.floor(Math.random() * 1000)}`, {
    tags: { endpoint: 'user_check' }
  });

  check(response, {
    'user check status 200': (r) => r.status === 200,
    'user check fast': (r) => r.timings.duration < 50,
  });
}

function testAuth() {
  const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'testuser',
    password: 'wrongpassword'
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'auth' }
  });

  check(response, {
    'auth response received': (r) => r.status === 401 || r.status === 200,
    'auth fast': (r) => r.timings.duration < 100,
  });
}
