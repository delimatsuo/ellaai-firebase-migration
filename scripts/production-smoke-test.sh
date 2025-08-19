#!/bin/bash

# EllaAI Production Smoke Test
# Quick verification of critical production features

set -e

echo "🚀 EllaAI Production Smoke Test"
echo "================================"
echo "Testing: https://ellaai-platform-prod.web.app"
echo "API: https://api-dl3telj45a-uc.a.run.app"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test frontend availability
echo ""
echo "📱 Frontend Tests"
echo "-----------------"
run_test "Frontend accessible" "curl -s -o /dev/null -w '%{http_code}' https://ellaai-platform-prod.web.app | grep -q '200'"
run_test "Frontend has content" "curl -s https://ellaai-platform-prod.web.app | grep -q '<!DOCTYPE html>'"
run_test "JavaScript bundle loaded" "curl -s https://ellaai-platform-prod.web.app | grep -q -E '(main|index)\.[a-z0-9]+\.js'"
run_test "CSS bundle loaded" "curl -s https://ellaai-platform-prod.web.app | grep -q -E '(main|index)\.[a-z0-9]+\.css'"

# Test API availability
echo ""
echo "🌐 API Tests"
echo "------------"
run_test "API health check" "curl -s -o /dev/null -w '%{http_code}' https://api-dl3telj45a-uc.a.run.app/health | grep -q '200'"
run_test "API returns JSON" "curl -s https://api-dl3telj45a-uc.a.run.app/health | python3 -m json.tool > /dev/null"
run_test "CORS headers present" "curl -s -I https://api-dl3telj45a-uc.a.run.app/health | grep -q 'access-control-allow-origin'"

# Test Firebase services
echo ""
echo "🔥 Firebase Services"
echo "--------------------"
run_test "Firebase project accessible" "gcloud config get-value project | grep -q 'ellaai-platform-prod'"
run_test "Firestore configured" "firebase firestore:indexes --project ellaai-platform-prod > /dev/null 2>&1"
run_test "Functions deployed" "firebase functions:list --project ellaai-platform-prod | grep -q 'api'"

# Test security features
echo ""
echo "🔒 Security Tests"
echo "-----------------"
run_test "HTTPS enforced" "curl -s -o /dev/null -w '%{scheme}' https://ellaai-platform-prod.web.app | grep -q 'https'"
run_test "Security headers present" "curl -s -I https://api-dl3telj45a-uc.a.run.app/health | grep -q 'x-content-type-options'"

# Critical user flows
echo ""
echo "👤 User Flow Tests"
echo "------------------"
run_test "Login page accessible" "curl -s https://ellaai-platform-prod.web.app/login -o /dev/null -w '%{http_code}' | grep -q -E '(200|301|302)'"
run_test "Dashboard route exists" "curl -s https://ellaai-platform-prod.web.app/dashboard -o /dev/null -w '%{http_code}' | grep -q -E '(200|301|302)'"
run_test "Admin route exists" "curl -s https://ellaai-platform-prod.web.app/admin -o /dev/null -w '%{http_code}' | grep -q -E '(200|301|302)'"

# Performance checks
echo ""
echo "⚡ Performance Tests"
echo "--------------------"
response_time=$(curl -s -o /dev/null -w '%{time_total}' https://ellaai-platform-prod.web.app)
if (( $(echo "$response_time < 3" | bc -l) )); then
    echo -e "Frontend load time: ${GREEN}${response_time}s ✅${NC}"
    ((TESTS_PASSED++))
else
    echo -e "Frontend load time: ${RED}${response_time}s ❌ (>3s)${NC}"
    ((TESTS_FAILED++))
fi

api_time=$(curl -s -o /dev/null -w '%{time_total}' https://api-dl3telj45a-uc.a.run.app/health)
if (( $(echo "$api_time < 1" | bc -l) )); then
    echo -e "API response time: ${GREEN}${api_time}s ✅${NC}"
    ((TESTS_PASSED++))
else
    echo -e "API response time: ${RED}${api_time}s ❌ (>1s)${NC}"
    ((TESTS_FAILED++))
fi

# Test Report
echo ""
echo "═════════════════════════════════"
echo "📊 Test Summary"
echo "═════════════════════════════════"
echo -e "✅ Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Failed: ${RED}$TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo -e "📈 Pass Rate: ${PASS_RATE}%"
fi

echo ""
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Production is healthy.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please investigate.${NC}"
    exit 1
fi