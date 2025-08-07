# k6 Load Testing Configuration

## Test Scenarios

### 1. General Load Test (`load-test.js`)
- **Purpose**: Test overall system performance
- **Endpoints**: All public API endpoints + Redis monitoring
- **Load Pattern**:
  - Ramp up to 20 users (2 min)
  - Sustain 20 users (5 min)
  - Ramp up to 50 users (2 min)
  - Sustain 50 users (5 min)
  - Ramp up to 100 users (2 min)
  - Sustain 100 users (5 min)
  - Cool down (5 min)
- **Total Duration**: ~21 minutes

### 2. Admin Operations Test (`admin-load-test.js`)
- **Purpose**: Test admin dashboard and system monitoring
- **Endpoints**: Admin user management + Redis monitoring
- **Load Pattern**: Lower concurrency (5-10 admin users)
- **Duration**: ~10 minutes
- **Requirements**: Admin key `admin123`

### 3. Bloom Filter Stress Test (`bloom-filter-stress-test.js`)
- **Purpose**: High-throughput username validation
- **Focus**: Bloom filter performance under stress
- **Load Pattern**: Rapid ramp to 500 concurrent users
- **Duration**: ~6 minutes
- **Target**: Sub-100ms response times

## Performance Thresholds

### General Thresholds
- **Response Time**: 95% of requests < 500ms
- **Error Rate**: < 10% overall, < 5% for critical paths
- **Availability**: > 99% uptime during test

### Admin Thresholds
- **Response Time**: 95% of requests < 1000ms (admin operations can be slower)
- **Error Rate**: < 5% overall, < 2% for critical admin functions

### Bloom Filter Thresholds
- **Response Time**: 95% of requests < 200ms (username validation must be fast)
- **Error Rate**: < 1% (extremely reliable)
- **Throughput**: Handle 500+ concurrent username validations

## Running Tests

### Prerequisites
1. **API Server Running**: `npm run dev` or `npm start`
2. **Redis Server**: Redis must be accessible on default port
3. **k6 Installed**: Script will auto-install on Linux/macOS

### Quick Start
```bash
# Install k6 (if not already installed)
# Linux: apt-get install k6
# macOS: brew install k6
# Windows: choco install k6

# Run all tests
npm run loadtest

# Or use the script directly
./run-load-tests.sh all
```

### Individual Tests
```bash
# General load test
npm run loadtest:general
./run-load-tests.sh general

# Admin operations test
npm run loadtest:admin
./run-load-tests.sh admin

# Bloom filter stress test
npm run loadtest:bloom
./run-load-tests.sh bloom
```

### Custom URL
```bash
# Test against different environment
./run-load-tests.sh all https://api.production.com
./run-load-tests.sh general http://staging.local:3000
```

## Test Results

### Output Files
- Results saved to `k6-results/` directory
- JSON format with timestamp: `{test-name}_{timestamp}.json`
- Each test generates detailed metrics

### Key Metrics
- **HTTP Request Duration**: Response time percentiles
- **HTTP Request Rate**: Requests per second
- **HTTP Request Failed**: Error rate percentage
- **Custom Metrics**:
  - Bloom filter error rate
  - Admin operation response times
  - Redis health check success rate

### Analysis
```bash
# View test results
ls k6-results/

# Example result analysis
cat k6-results/general-load_20250807_123456.json | jq '.metrics'
```

## Expected Performance

### Baseline Performance (Development)
- **Username Validation**: < 50ms average
- **User Authentication**: < 100ms average
- **Redis Health Check**: < 10ms average
- **Admin Operations**: < 200ms average

### Production Targets
- **Username Validation**: < 25ms average, 1000+ req/sec
- **User Authentication**: < 75ms average, 500+ req/sec
- **Redis Health Check**: < 5ms average
- **System Monitoring**: < 100ms average

## Troubleshooting

### Common Issues

1. **API Not Accessible**
   ```bash
   # Check if API is running
   curl http://localhost:3000/health

   # Start API if needed
   npm run dev
   ```

2. **Admin Authentication Failed**
   ```bash
   # Verify admin key
   curl -H "X-Admin-Key: admin123" http://localhost:3000/api/admin/stats
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis status
   redis-cli ping

   # Start Redis if needed
   redis-server
   ```

4. **High Error Rates**
   - Check API logs for errors
   - Verify Redis is running
   - Ensure sufficient system resources
   - Consider lowering concurrency

### Performance Optimization Tips

1. **High Response Times**
   - Monitor Redis memory usage
   - Check database query performance
   - Profile API endpoints
   - Consider caching strategies

2. **Memory Issues**
   - Monitor Redis memory consumption
   - Implement cache eviction policies
   - Check for memory leaks

3. **Connection Limits**
   - Increase Redis max connections
   - Optimize connection pooling
   - Monitor file descriptor limits

## Continuous Integration

### Automated Testing
```yaml
# Example GitHub Actions workflow
- name: Run Load Tests
  run: |
    npm run dev &
    sleep 10
    npm run loadtest:general
    npm run loadtest:bloom
```

### Performance Monitoring
- Integrate with monitoring systems
- Set up alerts for performance degradation
- Track performance trends over time

## Environment-Specific Configurations

### Development
- Lower concurrency (20-50 users)
- Shorter test duration
- Focus on functional testing

### Staging
- Production-like load (100-200 users)
- Full test suite
- Performance baseline establishment

### Production
- Careful load testing
- Gradual ramp-up
- Monitor system resources closely
