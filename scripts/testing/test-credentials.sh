#!/bin/bash

# Test script for default login credentials
echo "🧪 Testing Default Login Credentials"
echo "=================================="

# Check if API is running
API_URL="http://localhost:3000"
UI_URL="http://localhost:4200"

echo "📡 Testing API health..."
if curl -s -f "$API_URL/health" > /dev/null; then
    echo "✅ API is running at $API_URL"
else
    echo "❌ API is not running. Please start with 'npm run dev'"
    exit 1
fi

echo ""
echo "🔑 Testing default user login..."
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin12345"}')

if echo "$RESPONSE" | grep -q "success\|token\|admin"; then
    echo "✅ Default user login successful: admin / admin12345"
else
    echo "❌ Default user login failed"
    echo "Response: $RESPONSE"
fi

echo ""
echo "🛡️ Testing admin access..."
ADMIN_RESPONSE=$(curl -s -X GET "$API_URL/api/admin/stats" \
    -H "X-Admin-Key: admin123")

if echo "$ADMIN_RESPONSE" | grep -q "totalUsers\|users"; then
    echo "✅ Admin access successful with key: admin123"
else
    echo "❌ Admin access failed"
    echo "Response: $ADMIN_RESPONSE"
fi

echo ""
echo "🌐 UI Access Points:"
echo "   📱 User Login: $UI_URL/login"
echo "   🛡️ Admin Login: $UI_URL/admin/login"
echo ""
echo "📋 Default Credentials Summary:"
echo "   👤 User: admin / admin12345"
echo "   🔑 Admin Key: admin123"
echo ""
echo "🎉 Test completed!"
