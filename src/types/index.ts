import { TradeStatus, DocType } from '@prisma/client';

export { TradeStatus, DocType };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TradeWithSummary {
  id: string;
  exporter: string;
  importer: string;
  issuingBank: string | null;
  confirmingBank: string | null;
  asset: string;
  amount: string;
  status: TradeStatus;
  requiredDocs: DocType[];
  expiryLedger: number;
  createdAt: Date;
  settledAt: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  latestEvent?: {
    eventType: string;
    timestamp: Date;
  };
  documentSummary: {
    total: number;
    verified: number;
  };
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  actor: string | null;
  meta: Record<string, unknown> | null;
  ledger: number;
  timestamp: Date;
}

export interface DocumentUploadResponse {
  cid: string;
  hash: string;
  url: string;
}

export interface NotificationPayload {
  tradeId: string;
  eventType: string;
  recipients: string[];
  data: Record<string, unknown>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface SmsTemplate {
  message: string;
}

export interface NotificationTemplate {
  email: EmailTemplate;
  sms: SmsTemplate;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  indexerLag: number;
  timestamp: Date;
}

export interface HorizonEvent {
  id: string;
  type: string;
  ledger: number;
  created_at: string;
  source_account: string;
  transaction_hash: string;
  contract?: string;
  topic?: string[];
  value?: {
    xdr: string;
  };
}

export interface ParsedContractEvent {
  eventType: string;
  tradeId: string;
  actor?: string;
  data: Record<string, unknown>;
  ledger: number;
  timestamp: Date;
}
