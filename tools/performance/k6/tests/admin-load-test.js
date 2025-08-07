import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const adminResponseTime = new Trend('admin_response_time');

// Admin-focused test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Ramp up to 5 admin users
    { duration: '3m', target: 5 },    // Stay at 5 admin users
    { duration: '1m', target: 10 },   // Ramp up to 10 admin users
    { duration: '3m', target: 10 },   // Stay at 10 admin users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Admin operations can be slower
    http_req_failed: ['rate<0.05'],    // Very low error rate for admin
    errors: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
const ADMIN_KEY = 'admin123';

// Helper function to get admin headers
function getAdminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_KEY,
  };
}

export default function () {
  // Test 1: Admin Statistics
  let response = http.get(`${API_URL}/admin/stats`, {
    headers: getAdminHeaders(),
  });

  const adminStatsSuccess = check(response, {
    'Admin Stats: status is 200': (r) => r.status === 200,
    'Admin Stats: has user count': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.totalUsers !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!adminStatsSuccess) {
    errorRate.add(1);
  }
  adminResponseTime.add(response.timings.duration);

  // Test 2: User List with Pagination
  response = http.get(`${API_URL}/admin/users?page=1&limit=10`, {
    headers: getAdminHeaders(),
  });

  check(response, {
    'User List: status is 200': (r) => r.status === 200,
    'User List: has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.users && body.pagination;
      } catch {
        return false;
      }
    },
  });
  adminResponseTime.add(response.timings.duration);

  // Test 3: Search Users
  const searchTerms = ['admin', 'test', 'user', 'dev'];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

  response = http.get(`${API_URL}/admin/users?search=${searchTerm}`, {
    headers: getAdminHeaders(),
  });

  check(response, {
    'User Search: status is 200': (r) => r.status === 200,
  });
  adminResponseTime.add(response.timings.duration);

  // Test 4: Redis Health Monitoring
  response = http.get(`${API_URL}/redis/health`);

  check(response, {
    'Redis Health: status is 200 or 206 or 503': (r) => [200, 206, 503].includes(r.status),
    'Redis Health: has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.status;
      } catch {
        return false;
      }
    },
  });
  adminResponseTime.add(response.timings.duration);

  // Test 5: Redis Statistics
  response = http.get(`${API_URL}/redis/stats`);

  check(response, {
    'Redis Stats: status is 200': (r) => r.status === 200,
    'Redis Stats: has performance metrics': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data &&
               body.data.opsPerSecond !== undefined &&
               body.data.hitRate !== undefined;
      } catch {
        return false;
      }
    },
  });
  adminResponseTime.add(response.timings.duration);

  // Test 6: Cache Analysis
  response = http.get(`${API_URL}/redis/cache/analysis`);

  check(response, {
    'Cache Analysis: status is 200': (r) => r.status === 200,
    'Cache Analysis: has key patterns': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data &&
               body.data.totalKeys !== undefined &&
               Array.isArray(body.data.patterns);
      } catch {
        return false;
      }
    },
  });
  adminResponseTime.add(response.timings.duration);

  // Test 7: Cache Management (Clear pattern) - Only occasionally
  if (Math.random() < 0.1) { // 10% chance
    response = http.del(`${API_URL}/redis/cache/clear/test:*`);

    check(response, {
      'Cache Clear: status is 200 or 400': (r) => [200, 400].includes(r.status),
    });
    adminResponseTime.add(response.timings.duration);
  }

  sleep(2); // Longer sleep for admin operations
}

export function setup() {
  console.log('🔐 Starting k6 admin load test');
  console.log(`📊 Target URL: ${BASE_URL}`);
  console.log('👨‍💼 Testing admin operations and system monitoring');

  // Verify admin access
  const response = http.get(`${API_URL}/admin/stats`, {
    headers: getAdminHeaders(),
  });

  if (response.status !== 200) {
    throw new Error(`Admin access failed. Status: ${response.status}. Check admin key.`);
  }

  console.log('✅ Admin authentication verified - starting admin load test');
  return { baseUrl: BASE_URL };
}

export function teardown(data) {
  console.log('🏁 Admin k6 load test completed');
  console.log('📈 Admin operations performance tested');
}
