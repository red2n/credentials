#!/bin/bash

# k6 Test Results Analysis Script
# Analyzes k6 JSON output files to provide performance insights

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

echo -e "${PURPLE}🔐 Credentials Management System - k6 Results Analysis${NC}"
echo "============================================================"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. Installing...${NC}"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y jq
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq
    else
        echo -e "${RED}❌ Please install jq manually to analyze results${NC}"
        exit 1
    fi
fi

# Function to analyze a single test result
analyze_test_result() {
    local file="$1"
    local test_name=$(basename "$file" .json)

    echo -e "\n${CYAN}📊 Analysis for: ${WHITE}$test_name${NC}"
    echo "----------------------------------------"

    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        return
    fi

    # Extract key metrics
    local http_reqs=$(jq -r '.metrics.http_reqs.count' "$file" 2>/dev/null || echo "N/A")
    local http_req_duration_avg=$(jq -r '.metrics.http_req_duration.avg' "$file" 2>/dev/null || echo "N/A")
    local http_req_duration_p95=$(jq -r '.metrics.http_req_duration."p(95)"' "$file" 2>/dev/null || echo "N/A")
    local http_req_failed_rate=$(jq -r '.metrics.http_req_failed.rate' "$file" 2>/dev/null || echo "N/A")
    local checks_passed=$(jq -r '.metrics.checks.passes' "$file" 2>/dev/null || echo "N/A")
    local checks_failed=$(jq -r '.metrics.checks.fails' "$file" 2>/dev/null || echo "N/A")
    local vus_max=$(jq -r '.metrics.vus_max.max' "$file" 2>/dev/null || echo "N/A")
    local iterations=$(jq -r '.metrics.iterations.count' "$file" 2>/dev/null || echo "N/A")
    local data_received=$(jq -r '.metrics.data_received.count' "$file" 2>/dev/null || echo "N/A")
    local test_duration=$(jq -r '.state.testRunDurationMs' "$file" 2>/dev/null || echo "N/A")

    # Calculate derived metrics
    local rps=""
    if [[ "$http_reqs" != "N/A" && "$test_duration" != "N/A" ]]; then
        rps=$(echo "scale=2; $http_reqs / ($test_duration / 1000)" | bc 2>/dev/null || echo "N/A")
    fi

    # Convert milliseconds to a readable format
    local duration_readable=""
    if [[ "$test_duration" != "N/A" ]]; then
        local seconds=$(echo "scale=1; $test_duration / 1000" | bc 2>/dev/null || echo "N/A")
        duration_readable="${seconds}s"
    fi

    # Convert bytes to readable format
    local data_mb=""
    if [[ "$data_received" != "N/A" ]]; then
        data_mb=$(echo "scale=2; $data_received / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
        data_mb="${data_mb} MB"
    fi

    # Convert durations from seconds to milliseconds for display
    local avg_ms=""
    local p95_ms=""
    if [[ "$http_req_duration_avg" != "N/A" ]]; then
        avg_ms=$(echo "scale=2; $http_req_duration_avg * 1000" | bc 2>/dev/null || echo "N/A")
        avg_ms="${avg_ms} ms"
    fi
    if [[ "$http_req_duration_p95" != "N/A" ]]; then
        p95_ms=$(echo "scale=2; $http_req_duration_p95 * 1000" | bc 2>/dev/null || echo "N/A")
        p95_ms="${p95_ms} ms"
    fi

    # Convert error rate to percentage
    local error_pct=""
    if [[ "$http_req_failed_rate" != "N/A" ]]; then
        error_pct=$(echo "scale=2; $http_req_failed_rate * 100" | bc 2>/dev/null || echo "N/A")
        error_pct="${error_pct}%"
    fi

    # Display metrics
    echo -e "${BLUE}📈 Performance Metrics:${NC}"
    echo "  • Total Requests: $http_reqs"
    echo "  • Requests/Second: $rps"
    echo "  • Average Response Time: $avg_ms"
    echo "  • 95th Percentile Response Time: $p95_ms"
    echo "  • Error Rate: $error_pct"

    echo -e "\n${BLUE}🔄 Load Characteristics:${NC}"
    echo "  • Max Virtual Users: $vus_max"
    echo "  • Total Iterations: $iterations"
    echo "  • Test Duration: $duration_readable"
    echo "  • Data Transferred: $data_mb"

    echo -e "\n${BLUE}✅ Test Quality:${NC}"
    echo "  • Checks Passed: $checks_passed"
    echo "  • Checks Failed: $checks_failed"

    # Performance assessment
    echo -e "\n${BLUE}🎯 Performance Assessment:${NC}"

    # Assess response time
    if [[ "$http_req_duration_avg" != "N/A" ]]; then
        local avg_num=$(echo "$http_req_duration_avg * 1000" | bc 2>/dev/null || echo "0")
        if (( $(echo "$avg_num < 50" | bc -l) )); then
            echo -e "  • Response Time: ${GREEN}Excellent${NC} (< 50ms avg)"
        elif (( $(echo "$avg_num < 200" | bc -l) )); then
            echo -e "  • Response Time: ${GREEN}Good${NC} (< 200ms avg)"
        elif (( $(echo "$avg_num < 500" | bc -l) )); then
            echo -e "  • Response Time: ${YELLOW}Fair${NC} (< 500ms avg)"
        else
            echo -e "  • Response Time: ${RED}Poor${NC} (> 500ms avg)"
        fi
    fi

    # Assess error rate
    if [[ "$http_req_failed_rate" != "N/A" ]]; then
        local error_num=$(echo "$http_req_failed_rate * 100" | bc 2>/dev/null || echo "100")
        if (( $(echo "$error_num < 1" | bc -l) )); then
            echo -e "  • Error Rate: ${GREEN}Excellent${NC} (< 1%)"
        elif (( $(echo "$error_num < 5" | bc -l) )); then
            echo -e "  • Error Rate: ${GREEN}Good${NC} (< 5%)"
        elif (( $(echo "$error_num < 10" | bc -l) )); then
            echo -e "  • Error Rate: ${YELLOW}Fair${NC} (< 10%)"
        else
            echo -e "  • Error Rate: ${RED}Poor${NC} (> 10%)"
        fi
    fi

    # Assess throughput
    if [[ "$rps" != "N/A" && "$rps" != "" ]]; then
        if (( $(echo "$rps > 100" | bc -l) )); then
            echo -e "  • Throughput: ${GREEN}High${NC} ($rps req/s)"
        elif (( $(echo "$rps > 50" | bc -l) )); then
            echo -e "  • Throughput: ${GREEN}Good${NC} ($rps req/s)"
        elif (( $(echo "$rps > 10" | bc -l) )); then
            echo -e "  • Throughput: ${YELLOW}Moderate${NC} ($rps req/s)"
        else
            echo -e "  • Throughput: ${RED}Low${NC} ($rps req/s)"
        fi
    fi
}

# Main execution
RESULTS_DIR="./k6-results"

if [[ ! -d "$RESULTS_DIR" ]]; then
    echo -e "${RED}❌ Results directory not found: $RESULTS_DIR${NC}"
    exit 1
fi

# Check if there are any result files
result_files=$(find "$RESULTS_DIR" -name "*.json" 2>/dev/null || true)

if [[ -z "$result_files" ]]; then
    echo -e "${YELLOW}⚠️  No test result files found in $RESULTS_DIR${NC}"
    exit 0
fi

# Analyze all result files
echo -e "${WHITE}Found test results:${NC}"
for file in $result_files; do
    echo "  • $(basename "$file")"
done

for file in $result_files; do
    analyze_test_result "$file"
done

echo -e "\n${PURPLE}============================================================${NC}"
echo -e "${WHITE}📋 Summary & Recommendations:${NC}"
echo -e "${CYAN}1. Monitor response times under increasing load${NC}"
echo -e "${CYAN}2. Ensure error rates stay below 5% for production workloads${NC}"
echo -e "${CYAN}3. Use these baselines for performance regression testing${NC}"
echo -e "${CYAN}4. Consider horizontal scaling if throughput requirements grow${NC}"
echo -e "${PURPLE}============================================================${NC}"
