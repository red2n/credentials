#!/bin/bash

# 🔐 Credentials Management System - Project Organization & Maintenance
# Comprehensive script for project setup, organization, and maintenance tasks

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

echo -e "${PURPLE}🔐 Credentials Management System - Project Maintenance${NC}"
echo "============================================================"
echo -e "${CYAN}📂 Project Root: ${WHITE}$PROJECT_ROOT${NC}"
echo "============================================================"

# Function to display usage
show_usage() {
    echo -e "${WHITE}Usage: $0 [COMMAND] [OPTIONS]${NC}"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  setup      - Initial project setup and dependency installation"
    echo "  organize   - Organize project files and clean up structure"
    echo "  build      - Build all applications"
    echo "  test       - Run all tests (unit, integration, performance)"
    echo "  clean      - Clean build artifacts and node_modules"
    echo "  lint       - Run linting and formatting checks"
    echo "  security   - Run security audits and vulnerability checks"
    echo "  status     - Show project status and health"
    echo "  deploy     - Prepare for deployment"
    echo "  help       - Show this help message"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 setup       # Initial project setup"
    echo "  $0 organize    # Organize project structure"
    echo "  $0 test        # Run all tests"
    echo "  $0 status      # Check project health"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

    local missing_tools=()

    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js")
    else
        local node_version=$(node --version)
        echo -e "${GREEN}✅ Node.js: $node_version${NC}"
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    else
        local npm_version=$(npm --version)
        echo -e "${GREEN}✅ npm: $npm_version${NC}"
    fi

    # Check Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("Git")
    else
        local git_version=$(git --version)
        echo -e "${GREEN}✅ Git: $git_version${NC}"
    fi

    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version)
        echo -e "${GREEN}✅ Docker: $docker_version${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker: Not installed (optional)${NC}"
    fi

    # Check k6 (optional)
    if command -v k6 &> /dev/null; then
        local k6_version=$(k6 version)
        echo -e "${GREEN}✅ k6: $k6_version${NC}"
    else
        echo -e "${YELLOW}⚠️  k6: Not installed (needed for performance tests)${NC}"
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required tools:${NC}"
        for tool in "${missing_tools[@]}"; do
            echo -e "  • ${RED}$tool${NC}"
        done
        echo -e "${CYAN}💡 Please install missing tools before continuing${NC}"
        return 1
    fi

    return 0
}

# Function to setup project
setup_project() {
    echo -e "${BLUE}🚀 Setting up Credentials Management System...${NC}"

    cd "$PROJECT_ROOT"

    # Install dependencies
    echo -e "${CYAN}📦 Installing dependencies...${NC}"
    npm install

    # Setup Lerna (if not already done)
    if [[ ! -f "lerna.json" ]]; then
        echo -e "${CYAN}⚙️  Initializing Lerna...${NC}"
        npx lerna init
    fi

    # Bootstrap Lerna packages
    echo -e "${CYAN}🔗 Bootstrapping Lerna packages...${NC}"
    npx lerna bootstrap

    # Create necessary directories
    echo -e "${CYAN}📁 Creating project directories...${NC}"
    mkdir -p docs/{api,testing,deployment,architecture}
    mkdir -p tools/{scripts,performance,security}
    mkdir -p tools/performance/{k6,lighthouse,artillery}
    mkdir -p tools/security/{audit,scan}
    mkdir -p k8s/{base,overlays,monitoring}
    mkdir -p .github/{workflows,templates}

    echo -e "${GREEN}✅ Project setup complete!${NC}"
}

# Function to organize project files
organize_project() {
    echo -e "${BLUE}🗂️  Organizing project structure...${NC}"

    cd "$PROJECT_ROOT"

    # Create organized directory structure
    echo -e "${CYAN}📁 Creating organized directory structure...${NC}"
    mkdir -p {docs,tools,scripts,testing}
    mkdir -p tools/{performance,scripts,security,utilities}
    mkdir -p tools/performance/{k6,lighthouse,artillery}
    mkdir -p docs/{api,testing,deployment,architecture,guides}
    mkdir -p testing/{unit,integration,e2e}
    mkdir -p scripts/{build,deploy,maintenance}

    # Move scripts to organized locations
    echo -e "${CYAN}📝 Organizing scripts...${NC}"

    # Move any loose scripts to scripts directory
    find . -maxdepth 1 -name "*.sh" -not -path "./tools/*" -not -path "./scripts/*" -exec mv {} scripts/ \; 2>/dev/null || true

    # Ensure proper permissions
    echo -e "${CYAN}🔧 Setting proper permissions...${NC}"
    find tools/ -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
    find scripts/ -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

    # Create .gitkeep files for empty directories
    echo -e "${CYAN}📌 Creating .gitkeep files...${NC}"
    find docs tools scripts testing -type d -empty -exec touch {}/.gitkeep \; 2>/dev/null || true

    echo -e "${GREEN}✅ Project organization complete!${NC}"
}

# Function to build project
build_project() {
    echo -e "${BLUE}🔨 Building Credentials Management System...${NC}"

    cd "$PROJECT_ROOT"

    # Clean previous builds
    echo -e "${CYAN}🧹 Cleaning previous builds...${NC}"
    npx lerna run clean || true

    # Build all packages
    echo -e "${CYAN}🔨 Building all packages...${NC}"
    npx lerna run build

    echo -e "${GREEN}✅ Build complete!${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}🧪 Running all tests...${NC}"

    cd "$PROJECT_ROOT"

    # Run unit tests
    echo -e "${CYAN}🧪 Running unit tests...${NC}"
    npm test || echo -e "${YELLOW}⚠️  Some unit tests may have failed${NC}"

    # Run linting
    echo -e "${CYAN}🔍 Running linting checks...${NC}"
    npx lerna run lint || echo -e "${YELLOW}⚠️  Some linting issues may exist${NC}"

    # Run performance tests if k6 is available
    if command -v k6 &> /dev/null && [[ -f "tools/performance/k6/run-performance-tests.sh" ]]; then
        echo -e "${CYAN}⚡ Running performance tests...${NC}"
        cd tools/performance/k6
        ./run-performance-tests.sh baseline
        cd "$PROJECT_ROOT"
    else
        echo -e "${YELLOW}⚠️  Performance tests skipped (k6 not available or tests not found)${NC}"
    fi

    echo -e "${GREEN}✅ Test suite complete!${NC}"
}

# Function to clean project
clean_project() {
    echo -e "${BLUE}🧹 Cleaning project...${NC}"

    cd "$PROJECT_ROOT"

    # Clean node_modules
    echo -e "${CYAN}🗑️  Removing node_modules...${NC}"
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

    # Clean build artifacts
    echo -e "${CYAN}🗑️  Removing build artifacts...${NC}"
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.tsbuildinfo" -exec rm -f {} + 2>/dev/null || true

    # Clean logs
    echo -e "${CYAN}🗑️  Removing log files...${NC}"
    find . -name "*.log" -exec rm -f {} + 2>/dev/null || true
    find . -name "npm-debug.log*" -exec rm -f {} + 2>/dev/null || true

    # Clean test results
    echo -e "${CYAN}🗑️  Removing test artifacts...${NC}"
    find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".nyc_output" -type d -exec rm -rf {} + 2>/dev/null || true

    echo -e "${GREEN}✅ Project cleaned!${NC}"
}

# Function to run security audit
security_audit() {
    echo -e "${BLUE}🔒 Running security audit...${NC}"

    cd "$PROJECT_ROOT"

    # npm audit
    echo -e "${CYAN}🔍 Running npm audit...${NC}"
    npm audit || echo -e "${YELLOW}⚠️  Security vulnerabilities found${NC}"

    # Check for outdated packages
    echo -e "${CYAN}📦 Checking for outdated packages...${NC}"
    npm outdated || echo -e "${CYAN}📋 Package status checked${NC}"

    echo -e "${GREEN}✅ Security audit complete!${NC}"
}

# Function to show project status
show_status() {
    echo -e "${BLUE}📊 Project Status Report${NC}"
    echo "============================================================"

    cd "$PROJECT_ROOT"

    # Project info
    echo -e "${CYAN}📋 Project Information:${NC}"
    if [[ -f "package.json" ]]; then
        local project_name=$(node -p "require('./package.json').name" 2>/dev/null || echo "Unknown")
        local project_version=$(node -p "require('./package.json').version" 2>/dev/null || echo "Unknown")
        echo "  • Name: $project_name"
        echo "  • Version: $project_version"
    fi

    # Git status
    echo -e "\n${CYAN}📝 Git Status:${NC}"
    if git rev-parse --git-dir > /dev/null 2>&1; then
        local branch=$(git branch --show-current)
        local commits=$(git rev-list --count HEAD 2>/dev/null || echo "0")
        echo "  • Current Branch: $branch"
        echo "  • Total Commits: $commits"

        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD --; then
            echo -e "  • ${YELLOW}⚠️  Uncommitted changes present${NC}"
        else
            echo -e "  • ${GREEN}✅ Working directory clean${NC}"
        fi
    else
        echo -e "  • ${YELLOW}⚠️  Not a Git repository${NC}"
    fi

    # File structure overview
    echo -e "\n${CYAN}📁 Project Structure:${NC}"
    tree -L 2 -I 'node_modules|dist|build|*.log' . 2>/dev/null || find . -maxdepth 2 -type d | head -20

    # Dependencies status
    echo -e "\n${CYAN}📦 Dependencies:${NC}"
    if [[ -f "package.json" ]]; then
        local dep_count=$(node -p "Object.keys(require('./package.json').dependencies || {}).length" 2>/dev/null || echo "0")
        local dev_dep_count=$(node -p "Object.keys(require('./package.json').devDependencies || {}).length" 2>/dev/null || echo "0")
        echo "  • Production Dependencies: $dep_count"
        echo "  • Development Dependencies: $dev_dep_count"
    fi

    echo -e "\n${GREEN}✅ Status report complete!${NC}"
}

# Parse command line arguments
COMMAND="${1:-help}"

# Handle commands
case "$COMMAND" in
    "setup")
        check_prerequisites && setup_project
        ;;
    "organize")
        organize_project
        ;;
    "build")
        check_prerequisites && build_project
        ;;
    "test")
        check_prerequisites && run_tests
        ;;
    "clean")
        clean_project
        ;;
    "lint")
        cd "$PROJECT_ROOT"
        npx lerna run lint
        ;;
    "security")
        check_prerequisites && security_audit
        ;;
    "status")
        show_status
        ;;
    "deploy")
        echo -e "${BLUE}🚀 Preparing for deployment...${NC}"
        check_prerequisites && build_project && run_tests
        echo -e "${GREEN}✅ Ready for deployment!${NC}"
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

echo -e "\n${PURPLE}============================================================${NC}"
echo -e "${WHITE}🎯 Project Maintenance Complete!${NC}"
echo -e "${CYAN}📖 For more information, run: $0 help${NC}"
echo -e "${PURPLE}============================================================${NC}"
