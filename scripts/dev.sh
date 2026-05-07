#!/bin/bash

# Development script to run API and Indexer concurrently

set -e

echo "🚀 Starting Azaka API in development mode"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run 'pnpm setup' first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Generate Prisma client if needed
if [ ! -d node_modules/.prisma ]; then
    echo "🔧 Generating Prisma client..."
    pnpm prisma generate
fi

echo "Starting services..."
echo "- API server on http://localhost:3001"
echo "- Indexer in background"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Run both services concurrently
pnpm api & pnpm indexer &

# Wait for both processes
wait
