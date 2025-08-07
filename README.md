# 🔐 Credentials Management System

A modern, secure credential management system built with Angular and Fastify, featuring real-time username validation using Bloom filters and Redis caching.

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

### Available Scripts

```bash
# Development
npm run dev          # Start both API and UI in development mode
npm run start        # Start both services in production mode

# Building
npm run build        # Build all applications
npm run build:all    # Build all applications (alias)

# Testing
npm run test         # Run tests for all applications

# Cleaning
npm run clean        # Clean build artifacts
npm run clean:all    # Clean all build artifacts and node_modules
```

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

#### Production Deployment:
- [ ] Set up Kubernetes cluster
- [ ] Configure Docker registry
- [ ] Update deployment scripts with your registry
- [ ] Run `./deploy.sh production deploy`
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring (optional)
- [ ] Run load tests

**Happy scaling! 🚀**
