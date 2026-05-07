#!/bin/bash

# Quick API test script

API_URL="${API_URL:-http://localhost:3001}"

echo "🧪 Testing Azaka API at $API_URL"
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
HEALTH=$(curl -s "$API_URL/health")
echo "$HEALTH" | jq .

if echo "$HEALTH" | jq -e '.success == true' > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

echo ""

# Test trades endpoint
echo "2. Testing trades endpoint..."
TRADES=$(curl -s "$API_URL/trades?limit=5")
echo "$TRADES" | jq .

if echo "$TRADES" | jq -e '.success == true' > /dev/null; then
    echo "✅ Trades endpoint working"
else
    echo "❌ Trades endpoint failed"
    exit 1
fi

echo ""
echo "✅ All tests passed!"
