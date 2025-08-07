#!/bin/bash

# k6 Load Testing Script for Credentials Management System
# Usage: ./run-load-tests.sh [test-type] [base-url]

set -e

# Change to the script's directory to ensure relative paths work
SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_ROOT"

# Configuration
BASE_URL=${2:-"http://localhost:3000"}
TEST_TYPE=${1:-"all"}
RESULTS_DIR="./results"
SCRIPT_DIR="./scripts"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Function to check if API is running
check_api_health() {
    print_status "Checking API health at $BASE_URL..."

    if curl -f -s "$BASE_URL/health" > /dev/null; then
        print_status "✅ API is running and healthy"
        return 0
    else
        print_error "❌ API is not accessible at $BASE_URL"
        print_error "Please ensure the API server is running with: npm run dev"
        return 1
    fi
}

# Function to install k6 if not present
install_k6() {
    if ! command -v k6 &> /dev/null; then
        print_warning "k6 not found. Installing k6..."

        # Detect OS and install k6
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo gpg -k
            sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
            echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install k6
            else
                print_error "Homebrew not found. Please install k6 manually: https://k6.io/docs/getting-started/installation/"
                exit 1
            fi
        else
            print_error "Unsupported OS. Please install k6 manually: https://k6.io/docs/getting-started/installation/"
            exit 1
        fi

        print_status "✅ k6 installed successfully"
    else
        print_status "✅ k6 is already installed"
    fi
}

# Function to run a specific test
run_test() {
    local test_file=$1
    local test_name=$2
    local output_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.json"
    local full_test_path="$SCRIPT_DIR/$test_file"

    print_header "🚀 Running $test_name test..."
    print_status "Test file: $full_test_path"
    print_status "Results will be saved to: $output_file"

    # Run k6 test with JSON output
    if k6 run --out json="$output_file" -e BASE_URL="$BASE_URL" "$full_test_path"; then
        print_status "✅ $test_name test completed successfully"

        # Generate summary
        print_header "📊 $test_name Test Summary:"
        echo "Results saved to: $output_file"
        echo "Dashboard: You can analyze detailed results in the JSON file"
        echo ""
    else
        print_error "❌ $test_name test failed"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    print_header "🎯 Running all k6 tests for Credentials Management System"

    # Test 1: General Load Test
    run_test "load-test.js" "general-load"
    sleep 30 # Cool down between tests

    # Test 2: Admin Operations Test
    run_test "admin-load-test.js" "admin-operations"
    sleep 30 # Cool down between tests

    # Test 3: Bloom Filter Stress Test
    run_test "bloom-filter-stress-test.js" "bloom-filter-stress"

    print_header "🎉 All tests completed!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [test-type] [base-url]"
    echo ""
    echo "Test types:"
    echo "  all                    - Run all tests (default)"
    echo "  general               - General load test"
    echo "  admin                 - Admin operations test"
    echo "  bloom                 - Bloom filter stress test"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests on localhost:3000"
    echo "  $0 general                           # Run general load test only"
    echo "  $0 admin http://localhost:3000       # Run admin test on specific URL"
    echo "  $0 bloom https://api.example.com     # Run bloom filter test on production"
    echo ""
    echo "Prerequisites:"
    echo "  - API server must be running"
    echo "  - Redis must be accessible"
    echo "  - Admin key 'admin123' must be configured"
}

# Main execution
main() {
    print_header "🔐 Credentials Management System - k6 Load Testing Suite"
    print_status "Base URL: $BASE_URL"
    print_status "Test Type: $TEST_TYPE"
    echo ""

    # Check if help is requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi

    # Install k6 if needed
    install_k6

    # Check API health
    if ! check_api_health; then
        exit 1
    fi

    # Run tests based on type
    case $TEST_TYPE in
        "general")
            run_test "load-test.js" "general-load"
            ;;
        "admin")
            run_test "admin-load-test.js" "admin-operations"
            ;;
        "bloom")
            run_test "bloom-filter-stress-test.js" "bloom-filter-stress"
            ;;
        "all")
            run_all_tests
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            show_usage
            exit 1
            ;;
    esac

    print_header "📈 Load Testing Summary:"
    print_status "All test results are saved in: $RESULTS_DIR/"
    print_status "You can analyze the JSON files for detailed metrics"
    print_status "Next steps: Review performance metrics and optimize bottlenecks"
    echo ""
}

# Execute main function
main "$@"
