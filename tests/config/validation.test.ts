import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Config validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to force config re-evaluation
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should fail when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => {
      // Force re-import to trigger validation
      delete require.cache[require.resolve('../../src/config')];
      require('../../src/config');
    }).toThrow();
  });

  it('should fail when API_KEY is too short', () => {
    process.env.API_KEY = 'short';

    expect(() => {
      delete require.cache[require.resolve('../../src/config')];
      require('../../src/config');
    }).toThrow();
  });

  it('should accept valid testnet configuration', () => {
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

    expect(() => {
      delete require.cache[require.resolve('../../src/config')];
      require('../../src/config');
    }).not.toThrow();
  });

  it('should use default PORT when not specified', () => {
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

    delete require.cache[require.resolve('../../src/config')];
    const config = require('../../src/config').default;

    expect(config.PORT).toBe(3001);
  });
});
