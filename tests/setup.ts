import { afterAll, beforeEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://localhost:5432/azaka_test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.HORIZON_URL ??= 'https://horizon-testnet.stellar.org';
process.env.SOROBAN_RPC_URL ??= 'https://soroban-testnet.stellar.org';
process.env.STELLAR_NETWORK ??= 'testnet';
process.env.TRADE_CONTRACT_ID ??= 'test-trade-contract';
process.env.ESCROW_CONTRACT_ID ??= 'test-escrow-contract';
process.env.DOCUMENT_CONTRACT_ID ??= 'test-document-contract';
process.env.REGISTRY_CONTRACT_ID ??= 'test-registry-contract';
process.env.PINATA_API_KEY ??= 'test-pinata-key';
process.env.PINATA_SECRET_KEY ??= 'test-pinata-secret';
process.env.RESEND_API_KEY ??= 'test-resend-key';
process.env.TERMII_API_KEY ??= 'test-termii-key';
process.env.API_KEY ??= 'test_api_key_with_at_least_32_chars_long';

type Where = Record<string, unknown>;
type OrderBy = Record<string, 'asc' | 'desc'>;
type QueryArgs = {
  where?: Where;
  data?: Record<string, unknown> | Record<string, unknown>[];
  orderBy?: OrderBy;
  skip?: number;
  take?: number;
  include?: Record<string, unknown>;
  select?: Record<string, boolean>;
};

const state = {
  trade: [] as Record<string, unknown>[],
  document: [] as Record<string, unknown>[],
  tradeEvent: [] as Record<string, unknown>[],
  participant: [] as Record<string, unknown>[],
  notificationSubscription: [] as Record<string, unknown>[],
  indexerCursor: [] as Record<string, unknown>[],
  idCounter: 0,
};

function resetState(): void {
  state.trade.length = 0;
  state.document.length = 0;
  state.tradeEvent.length = 0;
  state.participant.length = 0;
  state.notificationSubscription.length = 0;
  state.indexerCursor.length = 0;
  state.idCounter = 0;
}

function nextId(): string {
  state.idCounter += 1;
  return `test-id-${state.idCounter}`;
}

function matchesWhere(record: Record<string, unknown>, where: Where = {}): boolean {
  return Object.entries(where).every(([key, expected]) => {
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      const operators = expected as Record<string, unknown>;

      if ('lte' in operators && !((record[key] as number) <= (operators.lte as number))) return false;
      if ('lt' in operators && !((record[key] as Date | number) < (operators.lt as Date | number))) return false;
      if ('gte' in operators && !((record[key] as number) >= (operators.gte as number))) return false;
      if ('gt' in operators && !((record[key] as number) > (operators.gt as number))) return false;

      return true;
    }

    return record[key] === expected;
  });
}

function orderRecords(records: Record<string, unknown>[], orderBy?: OrderBy): Record<string, unknown>[] {
  if (!orderBy) return records;

  const [[field, direction]] = Object.entries(orderBy);
  return [...records].sort((left, right) => {
    const leftValue = left[field] as Date | number | string | undefined;
    const rightValue = right[field] as Date | number | string | undefined;

    if (leftValue === rightValue) return 0;
    if (leftValue === undefined) return 1;
    if (rightValue === undefined) return -1;

    const result = leftValue > rightValue ? 1 : -1;
    return direction === 'desc' ? -result : result;
  });
}

function applySelect(record: Record<string, unknown> | null, select?: Record<string, boolean>) {
  if (!record || !select) return record;

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, include]) => include)
      .map(([key]) => [key, record[key]])
  );
}

function withTradeIncludes(trade: Record<string, unknown>, include?: Record<string, unknown>) {
  if (!include) return trade;

  const result = { ...trade };

  if (include.events) {
    const eventArgs = include.events as QueryArgs;
    result.events = orderRecords(
      state.tradeEvent.filter((event) => event.tradeId === trade.id),
      eventArgs.orderBy
    ).slice(0, eventArgs.take);
  }

  if (include.documents) {
    const documentArgs = include.documents as QueryArgs;
    result.documents = orderRecords(
      state.document.filter((document) => document.tradeId === trade.id),
      documentArgs.orderBy
    ).map((document) => applySelect(document, documentArgs.select));
  }

  return result;
}

function createModel(collectionName: keyof typeof state, defaults: () => Record<string, unknown> = () => ({})) {
  const collection = state[collectionName] as Record<string, unknown>[];

  return {
    async deleteMany(args: QueryArgs = {}) {
      const before = collection.length;
      const remaining = collection.filter((record) => !matchesWhere(record, args.where));
      collection.splice(0, collection.length, ...remaining);
      return { count: before - collection.length };
    },
    async create(args: QueryArgs) {
      const record = { ...defaults(), ...(args.data as Record<string, unknown>) };
      collection.push(record);
      return { ...record };
    },
    async createMany(args: QueryArgs) {
      const items = args.data as Record<string, unknown>[];
      collection.push(...items.map((item) => ({ ...defaults(), ...item })));
      return { count: items.length };
    },
    async count(args: QueryArgs = {}) {
      return collection.filter((record) => matchesWhere(record, args.where)).length;
    },
    async findMany(args: QueryArgs = {}) {
      const records = orderRecords(
        collection.filter((record) => matchesWhere(record, args.where)),
        args.orderBy
      );
      const start = args.skip ?? 0;
      const end = args.take === undefined ? undefined : start + args.take;
      return records.slice(start, end).map((record) => ({ ...record }));
    },
    async findFirst(args: QueryArgs = {}) {
      const records = await this.findMany({ ...args, take: 1 });
      return records[0] ?? null;
    },
    async findUnique(args: QueryArgs) {
      const record = collection.find((item) => matchesWhere(item, args.where)) ?? null;
      return applySelect(record ? { ...record } : null, args.select);
    },
    async update(args: QueryArgs) {
      const record = collection.find((item) => matchesWhere(item, args.where));
      if (!record) throw new Error(`${String(collectionName)} record not found`);
      Object.assign(record, args.data);
      return { ...record };
    },
    async updateMany(args: QueryArgs) {
      const records = collection.filter((record) => matchesWhere(record, args.where));
      records.forEach((record) => Object.assign(record, args.data));
      return { count: records.length };
    },
    async upsert(args: QueryArgs & { create?: Record<string, unknown>; update?: Record<string, unknown> }) {
      const record = collection.find((item) => matchesWhere(item, args.where));
      if (record) {
        Object.assign(record, args.update, { updatedAt: new Date() });
        return { ...record };
      }

      const created = { ...defaults(), ...args.create, updatedAt: new Date() };
      collection.push(created);
      return { ...created };
    },
  };
}

const prismaMock = {
  trade: {
    ...createModel('trade'),
    async findMany(args: QueryArgs = {}) {
      const records = orderRecords(
        state.trade.filter((record) => matchesWhere(record, args.where)),
        args.orderBy
      );
      const start = args.skip ?? 0;
      const end = args.take === undefined ? undefined : start + args.take;
      return records.slice(start, end).map((record) => withTradeIncludes(record, args.include));
    },
    async findUnique(args: QueryArgs) {
      const record = state.trade.find((item) => matchesWhere(item, args.where));
      return record ? withTradeIncludes(record, args.include) : null;
    },
  },
  document: createModel('document', () => ({ id: nextId(), verified: false })),
  tradeEvent: createModel('tradeEvent', () => ({ id: nextId() })),
  participant: createModel('participant'),
  notificationSubscription: createModel('notificationSubscription', () => ({
    id: nextId(),
    createdAt: new Date(),
  })),
  indexerCursor: createModel('indexerCursor', () => ({ updatedAt: new Date() })),
  $disconnect: vi.fn(),
  $executeRawUnsafe: vi.fn(),
};

vi.doMock('../src/db/client', () => ({
  default: prismaMock,
}));

beforeEach(() => {
  resetState();
});

afterAll(async () => {
  await prismaMock.$disconnect();
});
