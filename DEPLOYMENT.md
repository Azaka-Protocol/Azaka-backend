# Deployment Guide

This guide covers deploying Azaka API to various platforms.

## Prerequisites

Before deploying, ensure you have:
- PostgreSQL 16+ database provisioned
- Redis 7+ instance provisioned
- Stellar contract addresses deployed
- API keys for Pinata, Resend, and Termii
- Generated a secure API key (32+ characters)

## Environment Variables

All platforms require these environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:5432/azaka
REDIS_URL=redis://host:6379
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK=testnet
TRADE_CONTRACT_ID=<your-contract-id>
ESCROW_CONTRACT_ID=<your-contract-id>
DOCUMENT_CONTRACT_ID=<your-contract-id>
REGISTRY_CONTRACT_ID=<your-contract-id>
PINATA_API_KEY=<your-pinata-key>
PINATA_SECRET_KEY=<your-pinata-secret>
RESEND_API_KEY=<your-resend-key>
TERMII_API_KEY=<your-termii-key>
API_KEY=<generate-secure-32-char-key>
PORT=3001
```

## Railway

Railway is recommended for quick deployment with automatic PostgreSQL and Redis provisioning.

### Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create new project**
   ```bash
   railway init
   ```

3. **Add PostgreSQL and Redis**
   ```bash
   railway add --plugin postgresql
   railway add --plugin redis
   ```

4. **Set environment variables**
   ```bash
   railway variables set HORIZON_URL=https://horizon-testnet.stellar.org
   railway variables set STELLAR_NETWORK=testnet
   # ... set all other variables
   ```

5. **Deploy API service**
   ```bash
   railway up
   ```

6. **Deploy Indexer service**
   
   Create a second service in Railway dashboard:
   - Set start command to: `node dist/indexer/index.js`
   - Use same environment variables
   - Deploy from same repository

## Render

### API Service

1. Create new **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `pnpm install && pnpm build && pnpm prisma migrate deploy`
   - **Start Command**: `node dist/api/index.js`
   - **Environment**: Add all variables from `.env.example`

### Indexer Service

1. Create new **Background Worker**
2. Connect same repository
3. Configure:
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/indexer/index.js`
   - **Environment**: Use same variables as API service

### Database

1. Create **PostgreSQL** instance
2. Copy `DATABASE_URL` to both services

### Redis

1. Create **Redis** instance (or use external provider like Upstash)
2. Copy `REDIS_URL` to both services

## Fly.io

### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 2. Create fly.toml

```toml
app = "azaka-api"

[build]
  dockerfile = "docker/Dockerfile"

[env]
  PORT = "3001"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### 3. Provision PostgreSQL and Redis

```bash
fly postgres create --name azaka-db
fly redis create --name azaka-redis
```

### 4. Deploy

```bash
fly deploy
fly secrets set HORIZON_URL=https://horizon-testnet.stellar.org
# ... set all other secrets
```

### 5. Deploy Indexer

Create separate `fly-indexer.toml`:

```toml
app = "azaka-indexer"

[build]
  dockerfile = "docker/Dockerfile"

[env]
  PORT = "3001"

[processes]
  app = "node dist/indexer/index.js"
```

Deploy:
```bash
fly deploy -c fly-indexer.toml
```

## Docker (Self-Hosted)

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/azaka/azaka-api.git
cd azaka-api

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose logs -f api
docker-compose logs -f indexer
```

### Using Pre-built Images

```bash
# Pull latest image
docker pull ghcr.io/azaka/azaka-api:latest

# Run API
docker run -d \
  --name azaka-api \
  -p 3001:3001 \
  --env-file .env \
  ghcr.io/azaka/azaka-api:latest

# Run Indexer
docker run -d \
  --name azaka-indexer \
  --env-file .env \
  ghcr.io/azaka/azaka-api:latest \
  node dist/indexer/index.js
```

## Kubernetes

Example deployment manifests:

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: azaka-config
data:
  HORIZON_URL: "https://horizon-testnet.stellar.org"
  SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org"
  STELLAR_NETWORK: "testnet"
  PORT: "3001"
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: azaka-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  REDIS_URL: "redis://..."
  API_KEY: "your-secure-key"
  PINATA_API_KEY: "..."
  # ... other secrets
```

### API Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: azaka-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: azaka-api
  template:
    metadata:
      labels:
        app: azaka-api
    spec:
      containers:
      - name: api
        image: ghcr.io/azaka/azaka-api:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: azaka-config
        - secretRef:
            name: azaka-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Indexer Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: azaka-indexer
spec:
  replicas: 1  # Only one indexer instance
  selector:
    matchLabels:
      app: azaka-indexer
  template:
    metadata:
      labels:
        app: azaka-indexer
    spec:
      containers:
      - name: indexer
        image: ghcr.io/azaka/azaka-api:latest
        command: ["node", "dist/indexer/index.js"]
        envFrom:
        - configMapRef:
            name: azaka-config
        - secretRef:
            name: azaka-secrets
```

## Post-Deployment

### 1. Verify Health

```bash
curl https://your-api-url.com/health
```

Expected response:
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

### 2. Monitor Indexer

Check logs for:
- Successful cursor saves
- Event processing
- No repeated errors

### 3. Test API

```bash
# List trades
curl https://your-api-url.com/trades

# Upload document (requires API key)
curl -X POST https://your-api-url.com/documents/upload \
  -H "X-API-Key: your-key" \
  -F "file=@test.pdf" \
  -F "tradeId=test" \
  -F "docType=BillOfLading"
```

## Monitoring

### Recommended Metrics

- **Indexer lag**: Monitor `/health` endpoint
- **API response times**: Use APM tools (New Relic, Datadog)
- **Database connections**: Monitor Prisma connection pool
- **Redis queue depth**: Monitor BullMQ queue sizes
- **Error rates**: Track failed notifications and event processing

### Logging

All services use structured JSON logging via Pino. Configure log aggregation:

- **Datadog**: Use Datadog agent
- **Elasticsearch**: Ship logs via Filebeat
- **CloudWatch**: Use AWS CloudWatch agent

### Alerts

Set up alerts for:
- Indexer lag > 5 minutes
- API error rate > 1%
- Database connection failures
- Redis connection failures
- Failed notification delivery rate > 5%

## Scaling

### API Service

- **Horizontal**: Add more API instances (stateless)
- **Vertical**: Increase CPU/memory for high traffic

### Indexer Service

- **DO NOT scale horizontally**: Only one indexer instance should run
- **Vertical**: Increase resources if processing is slow

### Database

- Use connection pooling (Prisma handles this)
- Consider read replicas for heavy read workloads
- Monitor slow queries and add indexes as needed

### Redis

- Use Redis Cluster for high availability
- Monitor memory usage and eviction policies

## Troubleshooting

### Indexer not processing events

1. Check cursor in database:
   ```sql
   SELECT * FROM "IndexerCursor";
   ```

2. Verify Horizon connectivity:
   ```bash
   curl https://horizon-testnet.stellar.org/
   ```

3. Check logs for errors

### API returning stale data

- Check indexer lag in `/health`
- Verify database connectivity
- Check for database replication lag

### Notifications not sending

- Verify Resend/Termii API keys
- Check BullMQ queue status
- Review notification worker logs

## Security Checklist

- [ ] Use strong API_KEY (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Restrict database access to API/indexer IPs
- [ ] Use secrets management (not plain env vars in production)
- [ ] Enable rate limiting
- [ ] Monitor for suspicious API usage
- [ ] Regularly rotate API keys
- [ ] Keep dependencies updated

## Backup Strategy

### Database

- Enable automated daily backups
- Test restore procedures monthly
- Keep backups for 30 days minimum

### Redis

- Redis data is ephemeral (queues)
- No backup needed, but ensure high availability

### IPFS

- Documents are pinned to Pinata
- Pinata handles redundancy
- Consider secondary pinning service for critical documents
