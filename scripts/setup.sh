#!/bin/bash

# Azaka API Setup Script
# This script helps you set up the development environment

set -e

echo "🚀 Azaka API Setup"
echo "=================="
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Setup environment
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo ""
    echo "⚠️  Required configuration:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - REDIS_URL (Redis connection string)"
    echo "   - Contract IDs (from your Stellar deployment)"
    echo "   - API keys (Pinata, Resend, Termii)"
    echo "   - API_KEY (generate a secure 32+ character key)"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Docker detected. You can use docker-compose for local development:"
    echo "   docker-compose -f docker/docker-compose.yml up"
    echo ""
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
pnpm prisma generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Start PostgreSQL and Redis (or use docker-compose)"
echo "3. Run database migrations: pnpm prisma migrate deploy"
echo "4. Start the API: pnpm api"
echo "5. Start the indexer: pnpm indexer"
echo ""
echo "For more information, see README.md"
