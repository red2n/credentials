#!/bin/bash

# 🔐 Credentials Management System - Performance Testing Runner
# Unified script for running all performance tests with proper organization

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
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"
K6_DIR="$SCRIPT_DIR"
TESTS_DIR="$K6_DIR/tests"
RESULTS_DIR="$K6_DIR/results"

# Default configuration
DEFAULT_BASE_URL="http://localhost:3000"
DEFAULT_ADMIN_KEY="admin123"

# Ensure results directory exists
mkdir -p "$RESULTS_DIR"

echo -e "${PURPLE}🔐 Credentials Management System - k6 Performance Testing Suite${NC}"
echo "============================================================"
echo -e "${CYAN}📂 Project Root: ${WHITE}$PROJECT_ROOT${NC}"
echo -e "${CYAN}🧪 Tests Directory: ${WHITE}$TESTS_DIR${NC}"
echo -e "${CYAN}📊 Results Directory: ${WHITE}$RESULTS_DIR${NC}"
echo "============================================================"

# Function to display usage
show_usage() {
    echo -e "${WHITE}Usage: $0 [TEST_TYPE] [BASE_URL] [OPTIONS]${NC}"
    echo ""
    echo -e "${CYAN}Test Types:${NC}"
    echo "  all        - Run all test suites"
    echo "  general    - General API load test"
    echo "  admin      - Admin operations test"
    echo "  bloom      - Bloom filter stress test"
    echo "  baseline   - Quick baseline test (short duration)"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 all                                    # Run all tests against localhost"
    echo "  $0 bloom https://api.production.com      # Run bloom filter test against production"
    echo "  $0 general http://staging.local:3000     # Run general test against staging"
    echo "  $0 baseline                               # Quick baseline test"
    echo ""
    echo -e "${CYAN}Environment Variables:${NC}"
    echo "  ADMIN_KEY  - Admin API key (default: admin123)"
    echo "  K6_VUS     - Override virtual users"
    echo "  K6_DURATION - Override test duration"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        echo -e "${YELLOW}⚠️  k6 is not installed. Installing...${NC}"
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Installing k6 for Linux..."
            curl -s https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz | tar xvz --strip-components 1 -C /tmp
            sudo mv /tmp/k6 /usr/local/bin/
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Installing k6 for macOS..."
            brew install k6
        else
            echo -e "${RED}❌ Unsupported OS. Please install k6 manually: https://k6.io/docs/getting-started/installation/${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ k6 is already installed${NC}"
    fi

    # Check if API is accessible
    echo -e "${BLUE}🔍 Checking API health at $BASE_URL...${NC}"
    if curl -sf "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is running and healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  API health check failed. Continuing anyway...${NC}"
        echo -e "${CYAN}💡 Make sure your API server is running on $BASE_URL${NC}"
    fi
}

# Function to run a specific test
run_test() {
    local test_type="$1"
    local base_url="$2"
    local admin_key="$3"

    local test_file=""
    local test_name=""

    case "$test_type" in
        "general")
            test_file="$TESTS_DIR/load-test.js"
            test_name="general-load"
            ;;
        "admin")
            test_file="$TESTS_DIR/admin-load-test.js"
            test_name="admin-load"
            ;;
        "bloom")
            test_file="$TESTS_DIR/bloom-filter-stress-test.js"
            test_name="bloom-filter-stress"
            ;;
        "baseline")
            test_file="$TESTS_DIR/load-test.js"
            test_name="baseline"
            export K6_VUS="5"
            export K6_DURATION="30s"
            ;;
        *)
            echo -e "${RED}❌ Unknown test type: $test_type${NC}"
            return 1
            ;;
    esac

    if [[ ! -f "$test_file" ]]; then
        echo -e "${RED}❌ Test file not found: $test_file${NC}"
        return 1
    fi

    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local result_file="$RESULTS_DIR/${test_name}_${timestamp}.json"

    echo -e "${GREEN}🚀 Running $test_name test...${NC}"
    echo -e "${CYAN}📄 Test file: $(basename "$test_file")${NC}"
    echo -e "${CYAN}📊 Results will be saved to: $result_file${NC}"
    echo ""

    # Set environment variables for the test
    export BASE_URL="$base_url"
    export ADMIN_KEY="$admin_key"

    # Run k6 test
    if k6 run --out json="$result_file" "$test_file"; then
        echo -e "${GREEN}✅ $test_name test completed successfully${NC}"
        echo -e "${CYAN}📊 Results saved to: $result_file${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name test failed${NC}"
        return 1
    fi
}

# Function to run analysis on results
run_analysis() {
    echo -e "${BLUE}📊 Analyzing test results...${NC}"
    if [[ -f "$K6_DIR/analyze-k6-results.sh" ]]; then
        cd "$K6_DIR"
        bash analyze-k6-results.sh
    else
        echo -e "${YELLOW}⚠️  Analysis script not found. Results are available in: $RESULTS_DIR${NC}"
    fi
}

# Parse command line arguments
TEST_TYPE="${1:-all}"
BASE_URL="${2:-$DEFAULT_BASE_URL}"
ADMIN_KEY="${ADMIN_KEY:-$DEFAULT_ADMIN_KEY}"

# Handle help flag
if [[ "$TEST_TYPE" == "--help" || "$TEST_TYPE" == "-h" ]]; then
    show_usage
    exit 0
fi

# Validate inputs
if [[ ! "$BASE_URL" =~ ^https?:// ]]; then
    echo -e "${RED}❌ Invalid BASE_URL format. Must start with http:// or https://${NC}"
    echo "Provided: $BASE_URL"
    exit 1
fi

echo -e "${CYAN}🎯 Configuration:${NC}"
echo "  • Test Type: $TEST_TYPE"
echo "  • Base URL: $BASE_URL"
echo "  • Admin Key: ${ADMIN_KEY:0:8}..."
echo ""

# Check prerequisites
check_prerequisites

# Run tests based on type
case "$TEST_TYPE" in
    "all")
        echo -e "${BLUE}🎯 Running complete test suite...${NC}"

        failed_tests=()

        # Run each test type
        for test in "baseline" "bloom" "general" "admin"; do
            echo -e "\n${PURPLE}============================================================${NC}"
            if run_test "$test" "$BASE_URL" "$ADMIN_KEY"; then
                echo -e "${GREEN}✅ $test test passed${NC}"
            else
                echo -e "${RED}❌ $test test failed${NC}"
                failed_tests+=("$test")
            fi
        done

        echo -e "\n${PURPLE}============================================================${NC}"
        echo -e "${WHITE}📋 Test Suite Summary:${NC}"

        if [[ ${#failed_tests[@]} -eq 0 ]]; then
            echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
        else
            echo -e "${YELLOW}⚠️  Some tests failed:${NC}"
            for test in "${failed_tests[@]}"; do
                echo -e "  • ${RED}❌ $test${NC}"
            done
        fi
        ;;
    "baseline"|"general"|"admin"|"bloom")
        run_test "$TEST_TYPE" "$BASE_URL" "$ADMIN_KEY"
        ;;
    *)
        echo -e "${RED}❌ Unknown test type: $TEST_TYPE${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

# Run analysis
echo -e "\n${PURPLE}============================================================${NC}"
run_analysis

echo -e "\n${PURPLE}============================================================${NC}"
echo -e "${WHITE}🎯 Performance Testing Complete!${NC}"
echo -e "${CYAN}📊 View detailed results in: $RESULTS_DIR${NC}"
echo -e "${CYAN}📖 For more information, see: $PROJECT_ROOT/docs/testing/K6_TESTING_GUIDE.md${NC}"
echo -e "${PURPLE}============================================================${NC}"
