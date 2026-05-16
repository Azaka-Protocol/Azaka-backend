# Contributing to Azaka API

Thank you for your interest in contributing to Azaka API! This document provides guidelines and instructions for contributing.

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 16+
- Redis 7+

### Setup Without Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/azaka/azaka-api.git
   cd azaka-api
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start PostgreSQL and Redis**
   ```bash
   # macOS with Homebrew
   brew services start postgresql@16
   brew services start redis

   # Linux with systemd
   sudo systemctl start postgresql
   sudo systemctl start redis
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Run database migrations**
   ```bash
   pnpm prisma migrate dev
   pnpm prisma generate
   ```

6. **Start the services**
   ```bash
   # Terminal 1: API server
   pnpm api

   # Terminal 2: Indexer
   pnpm indexer
   ```

### Setup With Docker

```bash
docker-compose -f docker/docker-compose.yml up
```

## Pointing the Indexer at Stellar Testnet

To replay historical events from Stellar Testnet:

1. **Get a starting cursor**
   
   Visit Horizon to find a ledger cursor:
   ```
   https://horizon-testnet.stellar.org/ledgers?order=desc&limit=1
   ```

2. **Manually set the cursor in the database**
   ```sql
   INSERT INTO "IndexerCursor" (id, cursor, "updatedAt")
   VALUES (1, 'your-cursor-here', NOW())
   ON CONFLICT (id) DO UPDATE SET cursor = 'your-cursor-here';
   ```

3. **Start the indexer**
   ```bash
   pnpm indexer
   ```

   The indexer will begin processing events from that cursor forward.

## Development Workflow

## Alpha Contribution Map

Azaka API is currently scoped to a 40% alpha implementation. Run the API and visit:

```bash
curl http://localhost:3001/capabilities
```

Use the `planned` list as the source of truth for contributor-ready work. Each item includes the protocol area, related contract events, and a short implementation hint.

Good first protocol contributions:
- `document-onchain-indexing`: persist `DocumentSubmitted` events and add malformed-event tests.
- `document-signature-verification`: accumulate signers instead of marking a document verified optimistically.
- `settlement-release`: enable `TradeSettled` indexing after the contract performs document verification and escrow release.
- `cancellation-refund`: add cancellation/refund state transition tests before enabling the handler.
- `expiry-monitoring`: define current-ledger sourcing before running expiry jobs in production.
- `registry-authorisation-indexing`: add registry lifecycle handlers once contract events exist.

When promoting a planned capability, update `src/protocol/capabilities.ts`, wire the handler or route, and add tests that prove the boundary moved intentionally.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test -- --coverage
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

### Database Changes

When modifying the Prisma schema:

```bash
# Create a migration
pnpm prisma migrate dev --name your_migration_name

# Generate Prisma client
pnpm prisma generate

# View database in Prisma Studio
pnpm db:studio
```

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] **Types pass**: `pnpm typecheck` runs without errors
- [ ] **Tests pass**: `pnpm test` runs successfully
- [ ] **Lint clean**: `pnpm lint` shows no errors
- [ ] **No secrets committed**: Check for API keys, passwords, or tokens
- [ ] **Migrations included**: If you changed the schema, include the migration
- [ ] **Tests added**: New features should include tests
- [ ] **Documentation updated**: Update README.md if adding new features

## Code Style

- **No `any` types**: Use strict TypeScript throughout
- **Structured logging**: Use `logger` from `src/utils/logger.ts` with context
- **Error handling**: Never let the indexer crash on malformed events
- **Prisma only**: All database queries go through Prisma (no raw SQL except cursor upsert)
- **Async/await**: Prefer async/await over promises

### Example: Good Logging

```typescript
logger.info({ tradeId, actor, eventType }, 'Processing event');
logger.error({ error, tradeId }, 'Failed to process event');
```

### Example: Error Handling in Indexer

```typescript
try {
  await processEvent(event);
} catch (error) {
  logger.error({ error, eventId: event.id }, 'Failed to process event');
  // Don't throw - log and continue to avoid crashing the indexer
}
```

## Issue Labels

- **good first issue**: Good for newcomers
- **indexer**: Related to event indexing
- **notifications**: Email/SMS notifications
- **api**: REST API endpoints
- **infra**: Docker, CI/CD, deployment
- **bug**: Something isn't working
- **enhancement**: New feature or request

## Architecture Notes

### Cursor Persistence

The indexer's cursor persistence is **critical** for reliability. If the cursor doesn't survive restarts cleanly, events will be missed and trades will silently stall.

Key points:
- Cursor is saved every 10 events (balance between reliability and performance)
- Uses upsert to handle both initial save and updates
- Must never fail silently — errors are logged as CRITICAL
- On restart, indexer resumes from last saved cursor

### Stateless Design

The API and indexer are designed to be stateless (except for Postgres and Redis). Multiple instances can run in parallel safely. This enables:
- Horizontal scaling
- Zero-downtime deployments
- Resilience to instance failures

### Event Handlers

Each event handler in `src/indexer/handlers/` must:
1. Upsert the relevant Trade record
2. Insert a TradeEvent record
3. Enqueue a notification job
4. Log the event with structured logging
5. **Never throw** — catch errors and log to avoid crashing the indexer

## Questions?

- Open an issue for bugs or feature requests
- Join our [Discord](https://discord.gg/azaka) for discussions
- Check the [main Azaka repo](https://github.com/azaka/azaka-contracts) for smart contract questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
