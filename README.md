# 🔐 Credentials Management System

A comprehensive, enterprise-grade credentials management system built with modern technologies and best practices.

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Testing](#-testing)
- [Performance](#-performance)
- [Security](#-security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## 🚀 Project Overview

The Credentials Management System is a secure, scalable solution for managing digital credentials with enterprise-level features including:

- **Multi-tenant architecture** with role-based access control
- **High-performance Redis caching** with Bloom filters for rapid lookups
- **Real-time monitoring** with comprehensive health checks and analytics
- **Microservices architecture** with API and UI separation
- **Comprehensive testing suite** including unit, integration, and performance tests
- **Production-ready deployment** with Kubernetes and Docker support

## ✨ Features

### 🚀 User Management
- **Real-time Username Validation** - Instant feedback using Bloom filter algorithm
- **Secure Authentication** - Login/register with session management
- **User Registration** - Create accounts with duplicate username prevention
- **Profile Management** - View and manage user profiles

### 👨‍💼 Admin Dashboard
- **User Administration** - Comprehensive user management interface
- **Bulk Operations** - Deactivate multiple users simultaneously
- **User Statistics** - Real-time analytics and metrics
- **Search & Pagination** - Efficient user browsing with search functionality
- **User Status Management** - Activate/deactivate user accounts

### 🔍 Advanced Features
- **Bloom Filter Validation** - Probabilistic data structure for efficient username checking
- **Redis Caching** - High-performance caching layer
- **Cache Management** - Clear, rebuild, and refresh cache operations
- **Health Monitoring** - System health checks and statistics
- **CORS Support** - Cross-origin resource sharing configuration

## 🛠️ Technology Stack

### Frontend (Angular UI)
- **Angular 20.1.0** - Latest Angular with standalone components
- **Tailwind CSS 3.4.17** - Modern utility-first CSS framework
- **TypeScript 5.7.2** - Type-safe development
- **Signal-based State Management** - Angular's latest reactive primitives
- **Responsive Design** - Mobile-first approach with modern UI

### Backend (Fastify API)
- **Fastify 5.4.0** - High-performance web framework
- **TypeScript** - End-to-end type safety
- **Redis** - In-memory data structure store
- **Bloom Filters** - Probabilistic data structures for username validation
- **Pino Logger** - High-performance logging

### Development Tools
- **Lerna** - Monorepo management
- **PostCSS** - CSS processing and optimization
- **ESM Modules** - Modern JavaScript module system
- **Hot Reload** - Development server with live updates

## 🚀 Quick Start

### Prerequisites
- **Node.js** v22.17.1 or higher
- **npm** or **yarn**
- **Redis** server (for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd credentials
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Redis server**
   ```bash
   redis-server
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both the API server (port 3000) and Angular UI (port 4200) in parallel.

### 🔑 Default Login Credentials

#### **Regular User Login**
- **Username**: `admin`
- **Password**: `admin12345`
- **URL**: `http://localhost:4200/login`

#### **Admin Dashboard Access**
- **Admin Key**: `admin123`
- **URL**: `http://localhost:4200/admin/login`

#### **System Dashboard Access**
- **Access**: Available from Admin Dashboard → "System Monitor" button
- **URL**: `http://localhost:4200/system/dashboard`
- **Features**: Real-time Redis monitoring with 2-minute auto-refresh
- **Authentication**: Requires admin login

### Available Scripts

```bash
# Development
npm run dev          # Start both API and UI in development mode
npm run start        # Start both services in production mode

# Building
npm run build        # Build all applications
npm run build:all    # Build all applications (alias)

# Testing
npm run test                     # Run all tests (unit + integration)
npm run performance             # Run all performance tests
npm run performance:baseline    # Quick baseline test (30s)
npm run performance:general     # General API load test
npm run performance:admin       # Admin operations test
npm run performance:bloom       # Bloom filter stress test

# Project Maintenance
npm run setup                   # Initial project setup
npm run organize                # Organize project structure
npm run status                  # Show project health
npm run security                # Run security audit
npm run deploy                  # Prepare for deployment

# Cleaning
npm run clean        # Clean build artifacts
npm run clean:all    # Clean all build artifacts and node_modules
```

## 🧪 Testing

The Credentials Management System includes a comprehensive testing suite covering unit tests, integration tests, and performance testing with k6.

### Prerequisites for Testing

Before running tests, ensure the following:

1. **API Server is Running**
   ```bash
   # Start the development environment
   npm run dev

   # Or start just the API server
   cd apps/api && npm run dev
   ```

2. **Redis Server is Running**
   ```bash
   redis-server
   ```

3. **k6 is Installed (for performance tests)**
   ```bash
   # k6 will be auto-installed if not present, or install manually:
   # Linux
   wget https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz
   tar -xzf k6-v0.47.0-linux-amd64.tar.gz
   sudo mv k6 /usr/local/bin/

   # macOS
   brew install k6
   ```

### Unit and Integration Tests

```bash
# Run all tests
npm run test

# Run tests for specific applications
cd apps/api && npm test          # API tests only
cd apps/ui && npm test           # UI tests only

# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode
npm run test -- --watch
```

### Performance Testing with k6

Our performance testing suite uses Grafana k6 to ensure the system performs well under load.

#### Quick Performance Check

```bash
# Run a quick baseline performance test (30 seconds, 5 users)
npm run performance:baseline
```

#### Full Performance Test Suite

```bash
# Run all performance tests
npm run performance

# Run specific performance tests
npm run performance:general     # General API endpoints
npm run performance:admin       # Admin operations
npm run performance:bloom       # Bloom filter stress test
```

#### Advanced Performance Testing

```bash
# Test against different environments
./tools/performance/k6/run-performance-tests.sh bloom https://staging.example.com
./tools/performance/k6/run-performance-tests.sh all https://production.example.com

# Custom test parameters
K6_VUS=10 K6_DURATION=60s npm run performance:baseline
ADMIN_KEY=your-key npm run performance:admin

# Get help and see all options
./tools/performance/k6/run-performance-tests.sh --help
```

### Performance Test Scenarios

#### 1. Baseline Test (`performance:baseline`)
- **Duration**: 30 seconds
- **Virtual Users**: 5
- **Purpose**: Quick health check and baseline metrics
- **Endpoints Tested**: Health check, basic API endpoints

#### 2. General Load Test (`performance:general`)
- **Duration**: 5 minutes
- **Virtual Users**: 1-100 (ramped)
- **Purpose**: Test general API performance under normal load
- **Endpoints Tested**:
  - Authentication endpoints
  - Username validation
  - User profile operations
  - Bloom filter operations

#### 3. Admin Operations Test (`performance:admin`)
- **Duration**: 3 minutes
- **Virtual Users**: 1-50 (ramped)
- **Purpose**: Test admin-specific operations
- **Endpoints Tested**:
  - Admin authentication
  - User management operations
  - Bulk operations
  - Statistics endpoints

#### 4. Bloom Filter Stress Test (`performance:bloom`)
- **Duration**: 2 minutes
- **Virtual Users**: 1-200 (ramped)
- **Purpose**: High-throughput testing of Bloom filter operations
- **Endpoints Tested**:
  - Username validation (heavy load)
  - Cache operations
  - Bloom filter statistics

### Performance Benchmarks

Our system maintains the following performance standards:

| Metric | Target | Excellent | Acceptable |
|--------|--------|-----------|------------|
| **Bloom Filter Response Time** | < 2ms | < 1ms | < 5ms |
| **General API Response Time** | < 50ms | < 25ms | < 100ms |
| **Admin Operations Response Time** | < 100ms | < 50ms | < 200ms |
| **Error Rate** | < 0.1% | 0% | < 1% |
| **Throughput (req/s)** | > 1000 | > 2000 | > 500 |

### Test Results and Analysis

#### Viewing Results

```bash
# Results are automatically saved with timestamps
ls tools/performance/k6/results/

# View latest test results
./tools/performance/k6/analyze-k6-results.sh

# Manual analysis
cat tools/performance/k6/results/baseline_YYYYMMDD_HHMMSS.json
```

#### Sample Test Output

```
🔐 Credentials Management System - k6 Performance Testing Suite
============================================================
📊 Results Summary:
• Total Requests: 15,234
• Average Response Time: 1.48ms (Bloom filter)
• 95th Percentile: 2.1ms
• Error Rate: 0.00%
• Throughput: 2,538 req/s
============================================================
```

### Testing Best Practices

#### Before Running Tests

1. **Ensure Clean Environment**
   ```bash
   npm run clean
   npm run build
   ```

2. **Check System Status**
   ```bash
   npm run status
   ```

3. **Verify API Health**
   ```bash
   curl http://localhost:3000/health
   ```

#### During Development

1. **Run Tests Frequently**
   ```bash
   # Quick check during development
   npm run performance:baseline
   ```

2. **Monitor Performance Trends**
   ```bash
   # Regular performance monitoring
   npm run performance:bloom
   ```

3. **Test Before Commits**
   ```bash
   npm run test && npm run performance:baseline
   ```

### Troubleshooting Tests

#### Common Issues

**API Not Running**
```bash
Error: API not accessible. Status: 0
```
**Solution**: Start the API server with `npm run dev`

**Redis Not Available**
```bash
Error: Redis connection failed
```
**Solution**: Start Redis server with `redis-server`

**k6 Not Found**
```bash
k6: command not found
```
**Solution**: Install k6 or run `./tools/performance/k6/run-performance-tests.sh` (auto-installs)

#### Debug Mode

```bash
# Enable debug logging for tests
DEBUG=true npm run performance:baseline

# Verbose k6 output
k6 run --verbose tools/performance/k6/tests/load-test.js
```

### Continuous Integration

Our testing suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run test
    npm run performance:baseline

- name: Performance Regression Check
  run: |
    npm run performance:bloom
    # Check if response times are within acceptable limits
```

### Custom Testing

#### Creating Custom Tests

```bash
# Copy existing test as template
cp tools/performance/k6/tests/load-test.js tools/performance/k6/tests/my-test.js

# Edit test parameters and scenarios
# Run custom test
k6 run tools/performance/k6/tests/my-test.js
```

#### Environment-Specific Testing

```bash
# Test against local environment
npm run performance:baseline

# Test against staging
BASE_URL=https://staging.example.com npm run performance:baseline

# Test against production (use with caution)
BASE_URL=https://api.production.com npm run performance:baseline
```

### Test Documentation

For detailed testing information, see:
- **[K6 Testing Guide](docs/testing/K6_TESTING_GUIDE.md)** - Comprehensive k6 testing documentation
- **[K6 Test Results](docs/testing/K6_TEST_RESULTS.md)** - Performance benchmarks and analysis
- **[Project Organization](docs/PROJECT_ORGANIZATION.md)** - Testing infrastructure details

## 📚 API Documentation

### Authentication Endpoints

#### User Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/check/:username` - Check if username exists
- `GET /api/auth/profile/:username` - Get user profile
- `GET /api/auth/stats` - Get authentication statistics

### Username Validation

#### Bloom Filter Operations
- `POST /api/username/validate` - Validate username availability
- `POST /api/username/add` - Add username to system
- `GET /api/username/stats` - Get username statistics
- `POST /api/username/cache/clear` - Clear cache
- `POST /api/username/cache/rebuild` - Rebuild cache
- `GET /api/username/cache/validate` - Validate cache integrity
- `POST /api/username/cache/refresh` - Refresh cache
- `GET /api/username/cache/health` - Cache health status

### Admin Operations

#### User Management
- `GET /api/admin/users` - List all users with pagination
- `GET /api/admin/users/:username` - Get specific user details
- `DELETE /api/admin/users/:username` - Deactivate user
- `POST /api/admin/users/:username/reactivate` - Reactivate user
- `POST /api/admin/users/bulk-deactivate` - Bulk deactivate users
- `GET /api/admin/stats` - Get admin statistics

### System Health
- `GET /health` - API health check
- `GET /api` - Basic API status

## 🎨 UI Features

### Modern Design System
- **Gradient Backgrounds** - Beautiful gradient overlays and backgrounds
- **Animated Icons** - Interactive icons with hover effects
- **Enhanced Forms** - Professional form styling with validation feedback
- **Responsive Layout** - Mobile-first responsive design
- **Dark Theme** - Modern dark color scheme
- **Loading States** - Elegant loading indicators

### Page Components

#### Login Page (`/login`)
- Clean, modern login interface
- Real-time validation feedback
- Gradient text styling
- Social-style authentication UI

#### Registration Page (`/register`)
- Username availability checking
- Real-time validation indicators
- Password strength feedback
- Bloom filter integration

#### Landing Page (`/landing`)
- Welcome dashboard for authenticated users
- Quick navigation to key features
- User session information

#### Admin Login (`/admin/login`)
- Secure admin portal access
- Enhanced security notices
- Administrative key validation

#### Admin Dashboard (`/admin/dashboard`)
- Comprehensive user management
- Search and pagination
- Bulk operations
- User statistics
- Modern data table design

#### System Dashboard (`/system/dashboard`)
- **Real-time Redis monitoring** with 2-minute auto-refresh
- **Health status tracking** (healthy/degraded/unhealthy)
- **Performance metrics** (latency, operations/sec, hit rates)
- **Memory usage analysis** with visual indicators
- **Cache pattern analysis** showing key distribution
- **Cache management tools** for selective/complete clearing
- **Live status indicators** for system health and auto-refresh
- **Admin-only access** protected by authentication guard

## 🔧 Configuration

### Environment Setup

#### API Configuration
The API server runs on port 3000 by default and expects Redis to be available on the default port (6379).

#### UI Configuration
The Angular application runs on port 4200 and connects to the API at `http://localhost:3000`.

### Redis Configuration
The system uses Redis for:
- Bloom filter storage
- Session management
- Caching layer
- Statistics tracking

#### Redis Monitoring Endpoints
The API provides comprehensive Redis monitoring capabilities:

**Health Check**
```bash
GET /api/redis/health
```
Returns detailed Redis health information including:
- Connection status (`healthy`, `degraded`, `unhealthy`)
- Response latency
- Memory usage and pressure indicators
- Key count and uptime
- Redis version and error details

**Statistics**
```bash
GET /api/redis/stats
```
Provides Redis performance metrics:
- Total connections and commands processed
- Operations per second
- Cache hit/miss ratios
- Evicted and expired key counts

**Cache Analysis**
```bash
GET /api/redis/cache/analysis
```
Analyzes current cache contents:
- Key count by pattern
- Memory usage distribution
- Cache efficiency metrics
- Pattern-based insights

**Cache Management**
```bash
DELETE /api/redis/cache/clear/:pattern  # Clear specific pattern
DELETE /api/redis/cache/clear-all       # Clear all cache (admin only)
```
Selective cache clearing with pattern matching:
- Use patterns like `user:*`, `session:*`
- Prevents accidental full cache deletion
- Returns count of deleted entries

### CORS Configuration
CORS is configured to allow requests from:
- `http://localhost:4200` (Angular dev server)
- `http://127.0.0.1:4200`
- `http://localhost:3000` (API server)
- `http://127.0.0.1:3000`

## 🏗️ Architecture

### Monorepo Structure
```
credentials/
├── apps/
│   ├── api/          # Fastify backend service
│   └── ui/           # Angular frontend application
├── package.json      # Root package configuration
├── lerna.json        # Lerna monorepo configuration
└── tsconfig.json     # TypeScript configuration
```

### Data Flow
1. **User Registration/Login** → Angular UI → Fastify API → Redis Cache
2. **Username Validation** → Bloom Filter → Redis → Real-time UI Feedback
3. **Admin Operations** → Protected Routes → API Endpoints → Database Operations

### Security Features
- Session-based authentication
- Admin route protection
- CORS security
- Input validation
- Type-safe API contracts

## 🧪 Bloom Filter Implementation

The system uses Bloom filters for efficient username validation:

- **Size**: 95,851 bits
- **Hash Functions**: 7
- **False Positive Rate**: ~1%
- **Storage**: Redis-backed persistence
- **Performance**: O(1) lookup time

### Benefits
- **Memory Efficient** - Compact data structure
- **Fast Lookups** - Constant time complexity
- **Scalable** - Handles millions of usernames
- **Cache Friendly** - Redis integration

## 📊 Performance

### Optimizations
- **Bundle Size**: Optimized CSS bundle (39.98 kB)
- **Tree Shaking**: Unused code elimination
- **Lazy Loading**: Route-based code splitting
- **Caching**: Redis-based performance optimization
- **Hot Reload**: Fast development cycles

### Metrics
- **API Response Time**: < 50ms average
- **UI Load Time**: < 2s initial load
- **Username Validation**: < 10ms
- **Cache Hit Rate**: > 95%

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**red2n** <ksnavinkumar.diary@gmail.com>

---

## 🚀 Deployment Guide

### 🏗️ Deployment Options

We provide multiple deployment strategies optimized for different scaling needs:

#### 1. **Kubernetes (Recommended for Production)**
Best for high-traffic, enterprise deployments with auto-scaling requirements.

```bash
# Quick deployment
./deploy.sh production deploy

# Custom scaling
./deploy.sh production scale 10 5  # 10 API replicas, 5 UI replicas
```

**Features:**
- Auto-scaling based on CPU/memory usage
- Redis cluster for distributed Bloom filters
- Zero-downtime rolling deployments
- Built-in monitoring and health checks

#### 2. **Docker Compose (Great for Staging)**
Simplified container orchestration for medium-scale deployments.

```bash
# Production compose deployment
docker-compose -f docker-compose.production.yml up -d

# With monitoring stack
docker-compose -f docker-compose.production.yml --profile monitoring up -d
```

#### 3. **Development Setup**
Local development with hot reload.

```bash
npm run dev  # Starts both API and UI
```

### 📊 Scaling Capabilities

#### **Performance Targets:**
- **Username Validation**: 10,000+ requests/second
- **Concurrent Users**: 5,000+ simultaneous sessions
- **API Response Time**: <50ms average
- **UI Load Time**: <2s initial load
- **Uptime**: 99.9% availability

#### **Auto-scaling Configuration:**
```yaml
API Service: 3-20 replicas (CPU: 70%, Memory: 80%)
UI Service: 2-10 replicas (CPU: 70%, Memory: 80%)
Redis Cluster: 3-6 nodes with replication
```

### 🔧 Deployment Commands

```bash
# Build and deploy to production
./deploy.sh production deploy

# Scale services
./deploy.sh production scale 15 8

# Check deployment status
./deploy.sh production status

# View logs
./deploy.sh production logs api

# Rollback deployment
./deploy.sh production rollback

# Run load tests
./deploy.sh production loadtest
```

### 🛠️ Infrastructure Requirements

#### **Minimum Production Setup:**
- **Kubernetes Cluster**: 3 nodes (2 CPU, 4GB RAM each)
- **Redis**: 2GB memory, persistent storage
- **Load Balancer**: Nginx Ingress Controller
- **Monitoring**: Prometheus + Grafana (optional)

#### **High-Scale Setup:**
- **Kubernetes Cluster**: 10+ nodes (4 CPU, 8GB RAM each)
- **Redis Cluster**: 6 nodes with clustering enabled
- **CDN**: CloudFlare or AWS CloudFront
- **Multi-region**: Active-active deployment

### 🔍 Monitoring & Observability

Built-in monitoring includes:
- **Health Checks**: `/health` endpoint for all services
- **Metrics**: Prometheus integration
- **Logging**: Structured logging with Pino
- **Alerting**: Kubernetes probes and HPA

### 🚀 Getting Started Checklist

#### Development:
- [ ] Install Node.js v22.17.1+
- [ ] Install and start Redis server
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Navigate to `http://localhost:4200`
- [ ] **Test login with username: `admin` and password: `admin12345`**
- [ ] **Test admin access with key: `admin123` at `/admin/login`**

#### Production Deployment:
- [ ] Set up Kubernetes cluster
- [ ] Configure Docker registry
- [ ] Update deployment scripts with your registry
- [ ] Run `./deploy.sh production deploy`
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring (optional)
- [ ] Run load tests

**Happy scaling! 🚀**
