# Getting Started with Azaka API

Step-by-step guide to get Azaka API running locally or in production.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Node.js 20+** installed ([download](https://nodejs.org/))
- [ ] **pnpm** installed (`npm install -g pnpm`)
- [ ] **PostgreSQL 16+** running (or Docker)
- [ ] **Redis 7+** running (or Docker)
- [ ] **Stellar contract addresses** (from your deployment)
- [ ] **Pinata account** ([sign up](https://pinata.cloud/))
- [ ] **Resend account** ([sign up](https://resend.com/))
- [ ] **Termii account** ([sign up](https://termii.com/)) - optional for SMS

## Option 1: Quick Start with Docker (Recommended)

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/azaka/azaka-api.git
cd azaka-api

# Copy environment template
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` and fill in these values:

```bash
# These are auto-configured by docker-compose:
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/azaka
REDIS_URL=redis://redis:6379

# Stellar configuration:
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK=testnet

# Your deployed contract addresses:
TRADE_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ESCROW_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DOCUMENT_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REGISTRY_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Pinata (get from https://app.pinata.cloud/keys):
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Resend (get from https://resend.com/api-keys):
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Termii (get from https://termii.com/):
TERMII_API_KEY=your_termii_api_key

# Generate a secure random key (32+ characters):
API_KEY=$(openssl rand -base64 32)

# Port (default is fine):
PORT=3001
```

### Step 3: Start Services

```bash
docker-compose -f docker/docker-compose.yml up
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- API server on port 3001
- Indexer (background process)

### Step 4: Verify

```bash
# Check health
curl http://localhost:3001/health

# Expected response:
# {"success":true,"data":{"status":"ok","indexerLag":5,"timestamp":"..."}}

# List trades
curl http://localhost:3001/trades
```

✅ **You're done!** The API is running at `http://localhost:3001`

---

## Option 2: Local Development (Without Docker)

### Step 1: Install Dependencies

```bash
# Clone repository
git clone https://github.com/azaka/azaka-api.git
cd azaka-api

# Run setup script
pnpm setup
```

### Step 2: Start PostgreSQL and Redis

**macOS (Homebrew):**
```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install postgresql-16 redis-server
sudo systemctl start postgresql
sudo systemctl start redis
```

**Windows:**
- Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install Redis from [redis.io](https://redis.io/download) or use WSL

### Step 3: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE azaka;

# Exit
\q
```

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/azaka
REDIS_URL=redis://localhost:6379
# ... (fill in other values as shown in Option 1)
```

### Step 5: Run Migrations

```bash
pnpm db:migrate:deploy
pnpm db:generate
```

### Step 6: Start Services

**Terminal 1 - API Server:**
```bash
pnpm api
```

**Terminal 2 - Indexer:**
```bash
pnpm indexer
```

**Or use the dev script (runs both):**
```bash
pnpm dev
```

### Step 7: Verify

```bash
pnpm test:api
```

✅ **You're done!** The API is running at `http://localhost:3001`

---

## Getting Your API Keys

### Pinata (IPFS Storage)

1. Go to [pinata.cloud](https://pinata.cloud/)
2. Sign up for free account
3. Navigate to **API Keys** in dashboard
4. Click **New Key**
5. Enable **pinFileToIPFS** and **unpin** permissions
6. Copy **API Key** and **API Secret**

### Resend (Email)

1. Go to [resend.com](https://resend.com/)
2. Sign up for free account (100 emails/day)
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `re_`)

### Termii (SMS - Optional)

1. Go to [termii.com](https://termii.com/)
2. Sign up (Nigeria-focused, but works globally)
3. Navigate to **API Settings**
4. Copy your **API Key**

---

## Deploying Your Stellar Contracts

If you haven't deployed the Azaka smart contracts yet:

1. Clone the contracts repository:
   ```bash
   git clone https://github.com/azaka/azaka-contracts.git
   ```

2. Follow the deployment guide in that repository

3. Copy the deployed contract addresses to your `.env` file

---

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "indexerLag": 5,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. List Trades

```bash
curl http://localhost:3001/trades?limit=10
```

### 3. Upload Document (Requires API Key)

```bash
curl -X POST http://localhost:3001/documents/upload \
  -H "X-API-Key: your-api-key-from-env" \
  -F "file=@test-document.pdf" \
  -F "tradeId=test-trade-123" \
  -F "docType=BillOfLading"
```

Expected:
```json
{
  "success": true,
  "data": {
    "cid": "QmXyz...",
    "hash": "abc123...",
    "url": "https://gateway.pinata.cloud/ipfs/QmXyz..."
  }
}
```

### 4. Subscribe to Notifications

```bash
curl -X POST http://localhost:3001/notifications/subscribe \
  -H "X-API-Key: your-api-key-from-env" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "GEXPORTER...",
    "email": "user@example.com",
    "phone": "+2348012345678"
  }'
```

---

## Troubleshooting

### "Connection refused" errors

**Problem**: Can't connect to PostgreSQL or Redis

**Solution**:
```bash
# Check if services are running
# PostgreSQL:
pg_isready

# Redis:
redis-cli ping
```

### "Invalid environment configuration"

**Problem**: Missing or invalid environment variables

**Solution**:
- Check `.env` file exists
- Verify all required variables are set
- Ensure `API_KEY` is 32+ characters
- Verify URLs are valid

### "Prisma Client not generated"

**Problem**: Database client not initialized

**Solution**:
```bash
pnpm db:generate
```

### Indexer not processing events

**Problem**: No events showing up in database

**Solution**:
1. Check Horizon URL is correct
2. Verify contract addresses are deployed
3. Check indexer logs for errors
4. Verify network connectivity to Horizon

### "Rate limit exceeded"

**Problem**: Too many API requests

**Solution**:
- Default limit is 100 requests per 15 minutes
- Wait or adjust `src/api/middleware/rateLimit.ts`

---

## Next Steps

Once your API is running:

1. **Integrate with Frontend**
   - Point your web app to `http://localhost:3001`
   - Use the API endpoints for trade queries
   - Upload documents before submitting to smart contract

2. **Set Up Monitoring**
   - Monitor `/health` endpoint
   - Set up alerts for indexer lag
   - Track error rates

3. **Deploy to Production**
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform guides
   - Use environment-specific `.env` files
   - Enable HTTPS/TLS
   - Set up backups

4. **Customize**
   - Modify notification templates in `src/notifications/templates/`
   - Adjust rate limits in `src/api/middleware/rateLimit.ts`
   - Add custom event handlers in `src/indexer/handlers/`

---

## Common Commands

```bash
# Development
pnpm setup              # Initial setup
pnpm dev                # Run API + Indexer
pnpm api                # Run API only
pnpm indexer            # Run Indexer only

# Database
pnpm db:migrate         # Create migration
pnpm db:migrate:deploy  # Apply migrations
pnpm db:generate        # Generate Prisma client
pnpm db:studio          # Open Prisma Studio

# Testing
pnpm test               # Run all tests
pnpm test:watch         # Watch mode
pnpm test:api           # Test API endpoints
pnpm typecheck          # Type checking
pnpm lint               # Lint code

# Production
pnpm build              # Build for production
pnpm start:api          # Start API (production)
pnpm start:indexer      # Start Indexer (production)
```

---

## Getting Help

- **Documentation**: See [README.md](./README.md)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/azaka/azaka-api/issues)
- **Discord**: [Join our community](https://discord.gg/azaka)

---

## Quick Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `HORIZON_URL` | ✅ | Stellar Horizon endpoint |
| `STELLAR_NETWORK` | ✅ | `testnet` or `mainnet` |
| `TRADE_CONTRACT_ID` | ✅ | Trade contract address |
| `ESCROW_CONTRACT_ID` | ✅ | Escrow contract address |
| `DOCUMENT_CONTRACT_ID` | ✅ | Document contract address |
| `REGISTRY_CONTRACT_ID` | ✅ | Registry contract address |
| `PINATA_API_KEY` | ✅ | Pinata API key |
| `PINATA_SECRET_KEY` | ✅ | Pinata secret key |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `TERMII_API_KEY` | ✅ | Termii API key |
| `API_KEY` | ✅ | Your API authentication key (32+ chars) |
| `PORT` | ❌ | API port (default: 3001) |

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check |
| `/trades` | GET | No | List trades |
| `/trades/:id` | GET | No | Trade details |
| `/trades/:id/timeline` | GET | No | Event timeline |
| `/documents/:tradeId` | GET | No | List documents |
| `/documents/upload` | POST | Yes | Upload document |
| `/participants/:address` | GET | No | Participant info |
| `/notifications/subscribe` | POST | Yes | Subscribe |
| `/notifications/subscribe` | DELETE | Yes | Unsubscribe |

---

**Ready to build?** Start with `pnpm setup` and let's go! 🚀
