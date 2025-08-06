import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomItem, randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 200 },   // Ramp up to 200 users
    { duration: '2m', target: 200 },   // Stay at 200 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
    checks: ['rate>0.9'], // 90% of checks should pass
  },
};

const BASE_URL = 'http://localhost:3000/api';

// Sample data for testing
let existingUsernames = [];
let randomPasswords = [];

// Setup function to get existing usernames for testing
export function setup() {
  console.log('Setting up test data...');

  // Get random existing usernames for testing
  const response = http.get(`${BASE_URL}/auth/random/100`);
  if (response.status === 200) {
    const data = JSON.parse(response.body);
    existingUsernames = data.usernames || [];
  }

  // Generate random passwords for testing
  for (let i = 0; i < 100; i++) {
    randomPasswords.push(randomString(12));
  }

  console.log(`Setup complete. Got ${existingUsernames.length} existing usernames.`);

  return {
    existingUsernames,
    randomPasswords
  };
}

export default function(data) {
  const testType = Math.random();

  if (testType < 0.4) {
    // 40% - Username validation tests (Bloom filter)
    testUsernameValidation(data);
  } else if (testType < 0.7) {
    // 30% - User authentication tests
    testUserAuthentication(data);
  } else if (testType < 0.9) {
    // 20% - User existence checks
    testUserExistence(data);
  } else {
    // 10% - User registration tests
    testUserRegistration(data);
  }

  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
}

function testUsernameValidation(data) {
  const group = 'Username Validation (Bloom Filter)';

  // Test with existing username
  if (data.existingUsernames.length > 0) {
    const existingUsername = randomItem(data.existingUsernames);
    const response = http.post(`${BASE_URL}/username/validate`, JSON.stringify({
      username: existingUsername
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { test_type: group, username_type: 'existing' }
    });

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
      'existing username detected': (r) => {
        const body = JSON.parse(r.body);
        return body.mightExist === true;
      }
    }, { test_type: group });
  }

  // Test with random new username
  const newUsername = `newuser_${randomString(8)}`;
  const response2 = http.post(`${BASE_URL}/username/validate`, JSON.stringify({
    username: newUsername
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { test_type: group, username_type: 'new' }
  });

  check(response2, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'new username available': (r) => {
      const body = JSON.parse(r.body);
      return body.mightExist === false;
    }
  }, { test_type: group });
}

function testUserAuthentication(data) {
  const group = 'User Authentication';

  if (data.existingUsernames.length > 0) {
    const username = randomItem(data.existingUsernames);
    const password = randomItem(data.randomPasswords);

    const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      username: username,
      password: password
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { test_type: group }
    });

    check(response, {
      'status is 401 or 200': (r) => r.status === 401 || r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
      'response has success field': (r) => {
        const body = JSON.parse(r.body);
        return typeof body.success === 'boolean';
      }
    }, { test_type: group });
  }
}

function testUserExistence(data) {
  const group = 'User Existence Check';

  // Test with existing username
  if (data.existingUsernames.length > 0) {
    const existingUsername = randomItem(data.existingUsernames);
    const response = http.get(`${BASE_URL}/auth/check/${existingUsername}`, {
      tags: { test_type: group, username_type: 'existing' }
    });

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 50ms': (r) => r.timings.duration < 50,
      'existing user found': (r) => {
        const body = JSON.parse(r.body);
        return body.exists === true;
      }
    }, { test_type: group });
  }

  // Test with non-existing username
  const nonExistingUsername = `nonexistent_${randomString(10)}`;
  const response2 = http.get(`${BASE_URL}/auth/check/${nonExistingUsername}`, {
    tags: { test_type: group, username_type: 'non_existing' }
  });

  check(response2, {
    'status is 200': (r) => r.status === 200,
    'response time < 50ms': (r) => r.timings.duration < 50,
    'non-existing user not found': (r) => {
      const body = JSON.parse(r.body);
      return body.exists === false;
    }
  }, { test_type: group });
}

function testUserRegistration(data) {
  const group = 'User Registration';

  const newUsername = `testuser_${randomString(8)}_${Date.now()}`;
  const password = randomItem(data.randomPasswords);

  const response = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    username: newUsername,
    password: password,
    email: `${newUsername}@test.com`
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { test_type: group }
  });

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'user created successfully': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true;
    }
  }, { test_type: group });
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed!');
}
