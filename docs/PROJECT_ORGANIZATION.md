# 📁 Project Organization Guide

This document outlines the organized structure of the Credentials Management System and provides guidance for maintaining project organization.

## 🎯 Organization Principles

### 1. Separation of Concerns
- **`apps/`** - Application code (API and UI)
- **`tools/`** - Development and operational tools
- **`docs/`** - Documentation and guides
- **`k8s/`** - Kubernetes deployment configurations
- **`testing/`** - Legacy test files (being phased out)

### 2. Logical Grouping
- **Performance tools** grouped under `tools/performance/`
- **Maintenance scripts** under `tools/scripts/`
- **Security tools** under `tools/security/`
- **Documentation** categorized by type under `docs/`

### 3. Clear Naming Conventions
- Scripts end with `.sh` and are executable
- Directories use lowercase with hyphens
- Documentation uses uppercase for important files (README.md)

## 📂 Directory Structure Overview

```
credentials/
├── 📂 apps/                          # Applications
│   ├── 📂 api/                       # Backend API service
│   └── 📂 ui/                        # Frontend Angular application
├── 📂 docs/                          # Documentation
│   ├── 📂 api/                       # API documentation
│   ├── 📂 testing/                   # Testing guides and results
│   ├── 📂 deployment/                # Deployment guides
│   ├── 📂 architecture/              # Architecture documentation
│   └── 📂 guides/                    # User and developer guides
├── 📂 tools/                         # Development tools and utilities
│   ├── 📂 performance/               # Performance testing tools
│   │   ├── 📂 k6/                    # k6 performance tests
│   │   ├── 📂 lighthouse/            # Lighthouse performance tests
│   │   └── 📂 artillery/             # Artillery load tests
│   ├── 📂 scripts/                   # Utility scripts
│   └── 📂 security/                  # Security tools and audits
├── 📂 k8s/                          # Kubernetes configurations
└── 📂 .github/                       # GitHub workflows and templates
```

## 🔧 Tools Directory

### Performance Testing (`tools/performance/`)

**k6 Directory** (`tools/performance/k6/`):
- `tests/` - k6 test scripts
- `results/` - Test execution results
- `run-performance-tests.sh` - Unified test runner
- `analyze-k6-results.sh` - Results analysis tool

### Scripts (`tools/scripts/`)

**project-maintenance.sh** - Comprehensive project maintenance tool:
- `setup` - Initial project setup
- `organize` - Project structure organization
- `build` - Build all applications
- `test` - Run all tests
- `clean` - Clean artifacts
- `status` - Project health check
- `security` - Security audit
- `deploy` - Deployment preparation

### Security (`tools/security/`)

- Vulnerability scanning tools
- Dependency audit scripts
- Security configuration validators

## 📋 NPM Scripts Organization

### Core Scripts
```json
{
  "build": "Build all applications",
  "dev": "Start development environment",
  "test": "Run all tests",
  "lint": "Run linting checks"
}
```

### Maintenance Scripts
```json
{
  "setup": "Initial project setup",
  "organize": "Organize project structure",
  "status": "Show project status",
  "security": "Run security audit",
  "deploy": "Prepare for deployment"
}
```

### Performance Scripts
```json
{
  "performance": "Run all performance tests",
  "performance:baseline": "Quick baseline test",
  "performance:general": "General API load test",
  "performance:admin": "Admin operations test",
  "performance:bloom": "Bloom filter stress test"
}
```

## 🗂️ File Organization Best Practices

### 1. Script Organization
- All scripts should be executable (`chmod +x`)
- Use descriptive names with `.sh` extension
- Include header comments with purpose and usage
- Group related scripts in appropriate directories

### 2. Documentation Organization
- Group by category (api, testing, deployment, etc.)
- Use Markdown format for consistency
- Include table of contents for longer documents
- Cross-reference related documents

### 3. Test Organization
- Separate by test type (unit, integration, performance)
- Include results and analysis tools
- Maintain test data and fixtures in organized structure

### 4. Configuration Organization
- Environment-specific configurations in overlays
- Base configurations for common settings
- Clear naming for different environments

## 🚀 Migration Commands

To organize an existing project:

```bash
# Use the project maintenance tool
./tools/scripts/project-maintenance.sh organize

# Or run individual organization tasks
npm run organize
```

## 📝 Maintenance Guidelines

### Regular Maintenance Tasks

1. **Clean up build artifacts**
   ```bash
   npm run clean
   ```

2. **Check project health**
   ```bash
   npm run status
   ```

3. **Run security audits**
   ```bash
   npm run security
   ```

4. **Organize project structure**
   ```bash
   npm run organize
   ```

### When Adding New Components

1. **Scripts** - Add to appropriate directory under `tools/`
2. **Documentation** - Add to relevant category under `docs/`
3. **Tests** - Follow existing test organization patterns
4. **Update package.json** - Add appropriate npm scripts

### File Permissions

Ensure proper permissions for executable files:
```bash
find tools/ -name "*.sh" -exec chmod +x {} \;
```

## 🔄 Migration from Legacy Structure

### Old Structure → New Structure

- `testing/k6/` → `tools/performance/k6/`
- Loose scripts → `tools/scripts/`
- Security tools → `tools/security/`
- Documentation → `docs/` with categories

### Migration Scripts

The project maintenance tool handles migration automatically:
```bash
./tools/scripts/project-maintenance.sh organize
```

## 🎯 Future Organization Considerations

### Scalability
- Prepare for additional tool categories
- Consider sub-organization as tools grow
- Maintain consistent naming conventions

### Standardization
- Follow established patterns for new additions
- Document any deviations from standard structure
- Regular organization reviews and cleanup

### Automation
- Automated organization checks in CI/CD
- Scripts to validate project structure
- Automated cleanup of temporary files

---

This organization structure provides a scalable, maintainable foundation for the Credentials Management System while keeping related functionality grouped logically.
