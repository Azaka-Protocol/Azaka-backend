import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

function printConfigError(message: string): void {
  // Config validation runs before the logger is initialized.
  // eslint-disable-next-line no-console
  console.error(message);
}

const configSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  HORIZON_URL: z.string().url(),
  SOROBAN_RPC_URL: z.string().url(),
  STELLAR_NETWORK: z.enum(['testnet', 'mainnet']),
  TRADE_CONTRACT_ID: z.string().min(1),
  ESCROW_CONTRACT_ID: z.string().min(1),
  DOCUMENT_CONTRACT_ID: z.string().min(1),
  REGISTRY_CONTRACT_ID: z.string().min(1),
  PINATA_API_KEY: z.string().min(1),
  PINATA_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  TERMII_API_KEY: z.string().min(1),
  API_KEY: z.string().min(32),
  PORT: z.coerce.number().default(3001),
});

export type Config = z.infer<typeof configSchema>;

let config: Config;

try {
  config = configSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    printConfigError('❌ Invalid environment configuration:');
    error.errors.forEach((err) => {
      printConfigError(`  - ${err.path.join('.')}: ${err.message}`);
    });
    if (process.env.NODE_ENV === 'test') {
      throw error;
    }
    process.exit(1);
  }
  throw error;
}

export default config;
