import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Config validation', () => {
  const originalEnv = process.env;
  async function loadConfig() {
    vi.resetModules();
    return import('../../src/config/index');
  }

  beforeEach(() => {
    // Reset modules to force config re-evaluation
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should fail when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    await expect(async () => {
      // Force re-import to trigger validation
      await loadConfig();
    }).rejects.toThrow();
  });

  it('should fail when API_KEY is too short', async () => {
    process.env.API_KEY = 'short';

    await expect(async () => {
      await loadConfig();
    }).rejects.toThrow();
  });

  it('should accept valid testnet configuration', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.HORIZON_URL = 'https://horizon-testnet.stellar.org';
    process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
    process.env.STELLAR_NETWORK = 'testnet';
    process.env.TRADE_CONTRACT_ID = 'test';
    process.env.ESCROW_CONTRACT_ID = 'test';
    process.env.DOCUMENT_CONTRACT_ID = 'test';
    process.env.REGISTRY_CONTRACT_ID = 'test';
    process.env.PINATA_API_KEY = 'test';
    process.env.PINATA_SECRET_KEY = 'test';
    process.env.RESEND_API_KEY = 'test';
    process.env.TERMII_API_KEY = 'test';
    process.env.API_KEY = 'test_api_key_with_at_least_32_chars';

    await expect(loadConfig()).resolves.toBeDefined();
  });

  it('should use default PORT when not specified', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.HORIZON_URL = 'https://horizon-testnet.stellar.org';
    process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
    process.env.STELLAR_NETWORK = 'testnet';
    process.env.TRADE_CONTRACT_ID = 'test';
    process.env.ESCROW_CONTRACT_ID = 'test';
    process.env.DOCUMENT_CONTRACT_ID = 'test';
    process.env.REGISTRY_CONTRACT_ID = 'test';
    process.env.PINATA_API_KEY = 'test';
    process.env.PINATA_SECRET_KEY = 'test';
    process.env.RESEND_API_KEY = 'test';
    process.env.TERMII_API_KEY = 'test';
    process.env.API_KEY = 'test_api_key_with_at_least_32_chars';
    delete process.env.PORT;

    const config = (await loadConfig()).default;

    expect(config.PORT).toBe(3001);
  });
});
