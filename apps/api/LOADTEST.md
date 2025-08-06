# Load Testing Setup for Username Validation API

This directory contains load testing scripts for the Username Validation API with Bloom filter.

## Prerequisites

1. **Install k6**:
   ```bash
   # On Ubuntu/Debian
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6

   # Or using npm
   npm install -g k6
   ```

2. **Start the API server**:
   ```bash
   cd /home/subramani/credentials/apps/api
   npm run build
   node dist/index.js
   ```

3. **Ensure Redis is running**:
   ```bash
   redis-cli ping  # Should return PONG
   ```

## Load Test Scripts

### 1. Simple Load Test (`simple-loadtest.js`)
- Basic load test with 50 concurrent users
- Tests username validation, user checks, and authentication
- Duration: ~2 minutes
- Focus: Basic performance validation

**Run:**
```bash
k6 run simple-loadtest.js
```

### 2. Comprehensive Load Test (`loadtest.js`)
- Advanced load test with up to 200 concurrent users
- Tests all API endpoints with realistic scenarios
- Duration: ~8 minutes
- Focus: Stress testing and performance analysis

**Run:**
```bash
k6 run loadtest.js
```

## API Endpoints Tested

### Username Validation (Bloom Filter)
- `POST /api/username/validate` - Check if username might exist
- Performance target: <100ms response time

### User Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/check/:username` - Fast user existence check
- `POST /api/auth/register` - User registration

### Database Operations
- `GET /api/auth/stats` - Database statistics
- `GET /api/auth/random/:count` - Get random usernames for testing

### Cache Management
- `GET /api/username/cache/health` - Redis health check
- `POST /api/username/cache/rebuild` - Rebuild Bloom filter
- `POST /api/username/populate` - Populate from database

## Test Scenarios

1. **Username Validation Performance**: Tests Bloom filter efficiency
2. **Database Lookup Speed**: Tests in-memory database performance
3. **Authentication Load**: Simulates real user login scenarios
4. **Mixed Workload**: Realistic combination of operations

## Performance Targets

- **Response Time**: 95% under 200ms, 99% under 500ms
- **Error Rate**: <1%
- **Throughput**: >1000 requests/second
- **Bloom Filter**: <100ms for username validation

## Monitoring

During load tests, monitor:
- CPU and memory usage
- Redis performance
- API response times
- Error rates
- Bloom filter false positive rate

## Running Tests

1. **Quick Test**:
   ```bash
   k6 run simple-loadtest.js
   ```

2. **Full Load Test**:
   ```bash
   k6 run loadtest.js
   ```

3. **Custom Test**:
   ```bash
   k6 run --vus 100 --duration 2m simple-loadtest.js
   ```

## Results Analysis

k6 will output:
- HTTP request metrics
- Response time percentiles
- Error rates
- Check success rates
- Custom metrics per endpoint

Example output:
```
     ✓ username validate status 200
     ✓ username validate fast
     ✓ user check status 200
     ✓ user check fast

     http_req_duration..............: avg=45.2ms   min=12ms med=38ms max=234ms p(90)=78ms p(95)=112ms
     http_req_failed................: 0.12%   ✓ 23      ✗ 18677
     http_reqs......................: 18700   156.16/s
```
