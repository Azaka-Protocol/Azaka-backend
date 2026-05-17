# Contributing to Azaka Backend

Thank you for helping improve [Azaka-backend](https://github.com/Azaka-Protocol/Azaka-backend).

This service is the optional off-chain companion to the Soroban protocol in **[Azaka-contracts](https://github.com/Azaka-Protocol/Azaka-contracts)**. Before changing indexer behavior or API shapes, skim the contracts repo so your work stays aligned with on-chain events and state machines.

## Code of conduct

Participate respectfully and constructively. Harassment, discrimination, and bad-faith disruption are not tolerated. Maintainers may close issues or reject contributions that violate these expectations.

## Ways to contribute

- **Code changes** — fork the repository, push your branch to your fork, and open a pull request into `Azaka-Protocol/Azaka-backend`. We do not accept direct pushes from outside contributors to the upstream repo. See [Submitting changes](#submitting-changes-fork--pull-request).
- **Report bugs** — [open an issue](https://github.com/Azaka-Protocol/Azaka-backend/issues/new) with steps to reproduce, expected vs actual behavior, and environment (Node, network, contract IDs).
- **Suggest features** — open an issue describing the use case and how it maps to protocol capabilities (optional but helpful before a large PR).
- **Pick up alpha work** — use `/capabilities` and the [alpha contribution map](#alpha-contribution-map) below.
- **Fix docs or CI** — same fork → PR workflow as code changes.
- **Smart contract changes** — belong in [Azaka-contracts](https://github.com/Azaka-Protocol/Azaka-contracts); open a PR there. Coordinate here only for indexer/API follow-up in this repo.

## Local development setup

### Prerequisites

- Node.js 20+ (`corepack enable` recommended)
- pnpm 8+ (`corepack prepare pnpm@8 --activate`)
- PostgreSQL 16+
- Redis 7+

### Fork and clone

1. **Fork** [Azaka-backend](https://github.com/Azaka-Protocol/Azaka-backend) on GitHub (Fork → create under your account).
2. **Clone your fork** (replace `YOUR_GITHUB_USERNAME`):

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/Azaka-backend.git
cd Azaka-backend
git remote add upstream https://github.com/Azaka-Protocol/Azaka-backend.git
pnpm install
```

Use `upstream` to sync with the canonical repo before you branch or open a PR.

### Environment

```bash
cp .env.example .env
```

For local indexing against testnet, deploy or obtain contract IDs from [Azaka-contracts](https://github.com/Azaka-Protocol/Azaka-contracts) and set `TRADE_CONTRACT_ID`, `ESCROW_CONTRACT_ID`, `DOCUMENT_CONTRACT_ID`, and `REGISTRY_CONTRACT_ID`.

### Database

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### Run services

**With Docker (recommended for first run):**

```bash
docker compose -f docker/docker-compose.yml up
```

**Without Docker:**

```bash
# Terminal 1
pnpm api

# Terminal 2
pnpm indexer
```

Or `pnpm dev` after `pnpm setup`.

### Point the indexer at Stellar testnet

1. Find a starting cursor from Horizon, e.g.  
   `https://horizon-testnet.stellar.org/ledgers?order=desc&limit=1`
2. Seed the cursor in Postgres (see `IndexerCursor` in `prisma/schema.prisma`).
3. Start the indexer: `pnpm indexer`

Details and examples are in [GETTING_STARTED.md](./GETTING_STARTED.md).

## Alpha contribution map

Azaka Backend targets a ~40% **alpha** implementation. The source of truth for what is implemented vs planned:

```bash
curl http://localhost:3001/capabilities
```

Code mirror: `src/protocol/capabilities.ts`.

**Good first protocol contributions:**

| Capability ID | Focus |
|---------------|--------|
| `document-onchain-indexing` | Persist `DocumentSubmitted` events; add malformed-event tests |
| `document-signature-verification` | Accumulate signers; avoid optimistic verification |
| `settlement-release` | Enable `TradeSettled` indexing after contract release path is stable |
| `cancellation-refund` | Cancellation/refund state transitions and tests |
| `expiry-monitoring` | Reliable current-ledger sourcing before production expiry jobs |
| `registry-authorisation-indexing` | Registry lifecycle handlers when contract events exist |

When promoting a planned capability:

1. Update `src/protocol/capabilities.ts` (`implemented` vs `planned`).
2. Wire the indexer handler and/or API route.
3. Add tests that prove the boundary moved intentionally.
4. Mention the capability ID in your PR description.

## Submitting changes (fork → pull request)

All contributions are merged via **pull requests from forks**, not by pushing branches to `Azaka-Protocol/Azaka-backend` unless you are a maintainer with write access.

### 1. Sync your fork with upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
# or: git rebase upstream/main
git push origin main
```

### 2. Create a topic branch

Branch from up-to-date `main` on your fork:

```bash
git checkout -b feature/short-description
# examples: fix/issue-42-indexer-cursor, docs/contributing-fork-workflow
```

Keep PRs focused; split large changes when possible.

### 3. Develop and verify locally

Make your changes, then run the [CI-matching commands](#commands-match-ci) below.

### 4. Commit and push to your fork

```bash
git add .
git commit -m "feat: describe your change clearly"
git push origin feature/short-description
```

### 5. Open a pull request

On GitHub: **your fork** → branch `feature/...` → base repository **Azaka-Protocol/Azaka-backend**, base branch **`main`**.

- Use a clear title and description.
- Link issues (`Fixes #123`) and any [capability ID](#alpha-contribution-map) you implemented.
- Ensure CI checks pass on the PR (they run automatically).

Maintainers will review, request changes if needed, and merge when ready. After merge, you can delete your topic branch and sync `main` on your fork again.

## Development workflow

### Branching

- Always branch from `upstream/main` (or your fork’s `main` after syncing with upstream).
- Use descriptive names: `feature/...`, `fix/...`, `docs/...`.

### Commands (match CI)

```bash
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm test
```

With Postgres available (as in CI):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/azaka_test \
  pnpm prisma migrate deploy
```

### Database schema changes

```bash
pnpm prisma migrate dev --name describe_your_change
pnpm prisma generate
```

Commit the generated migration under `prisma/migrations/`.

## Pull request checklist

Before requesting review:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] No secrets, `.env` files, or API keys in the diff
- [ ] Schema changes include a Prisma migration
- [ ] New behavior has tests where practical
- [ ] README or CONTRIBUTING updated if you change setup, env vars, or public API
- [ ] PR description links related issues (`Fixes #123`) and notes any capability ID from the alpha map

## Code style

- **TypeScript:** strict typing; no `any` (enforced by ESLint).
- **Logging:** use `logger` from `src/utils/logger.ts` with structured context.
- **Indexer handlers:** must not crash the process on malformed events — log and continue.
- **Database:** use Prisma; avoid raw SQL except documented cases (e.g. cursor upsert).
- **Async:** prefer `async`/`await`.

Example:

```typescript
logger.info({ tradeId, actor, eventType }, 'Processing event');

try {
  await processEvent(event);
} catch (error) {
  logger.error({ error, eventId: event.id }, 'Failed to process event');
}
```

## Issue labels

Maintainers may use labels such as:

| Label | Meaning |
|-------|---------|
| `good first issue` | Suitable for newcomers |
| `indexer` | Horizon / event handling |
| `notifications` | Email or SMS |
| `api` | REST routes |
| `infra` | Docker, CI, deployment |
| `bug` | Incorrect behavior |
| `enhancement` | New feature or improvement |

## Architecture notes

### Cursor persistence

The indexer cursor must survive restarts. If it does not, events are skipped and trades can stall silently.

- Cursor is persisted periodically during streaming.
- Uses upsert for idempotent updates.
- Failures must be logged clearly; on restart, processing resumes from the last saved cursor.

### Stateless processes

API and indexer instances are stateless aside from Postgres and Redis, so you can run multiple replicas behind a load balancer when operations require it.

### Event handlers

Handlers under `src/indexer/handlers/` should:

1. Upsert the relevant `Trade` (or related) record.
2. Insert a `TradeEvent` where applicable.
3. Enqueue notification jobs when appropriate.
4. Log with structured fields.
5. Catch errors — do not throw out of the stream loop.

## Security

**Do not** file public issues for exploitable security problems.

Use [GitHub Security Advisories](https://github.com/Azaka-Protocol/Azaka-backend/security/advisories/new) for this repository. Include reproduction steps and impact; we will respond as soon as we can.

## Questions?

- **Backend bugs / features:** [Azaka-backend issues](https://github.com/Azaka-Protocol/Azaka-backend/issues)
- **Contracts / on-chain behavior:** [Azaka-contracts](https://github.com/Azaka-Protocol/Azaka-contracts)
- **Org:** [Azaka-Protocol on GitHub](https://github.com/Azaka-Protocol)

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE) used by this project.
