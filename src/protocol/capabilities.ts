export type CapabilityStatus = 'implemented' | 'planned';

export type CapabilityArea = 'trade' | 'escrow' | 'document' | 'registry' | 'operations';

export interface ProtocolCapability {
  id: string;
  area: CapabilityArea;
  title: string;
  status: CapabilityStatus;
  summary: string;
  contributorHint?: string;
  contractEvents?: string[];
  apiRoutes?: string[];
}

export const protocolCapabilities: ProtocolCapability[] = [
  {
    id: 'trade-indexing',
    area: 'trade',
    title: 'Trade event indexing and query API',
    status: 'implemented',
    summary: 'Mirror created trades from contract events and expose list/detail/timeline reads.',
    contractEvents: ['TradeCreated'],
    apiRoutes: ['GET /trades', 'GET /trades/:id', 'GET /trades/:id/timeline'],
  },
  {
    id: 'escrow-deposit-indexing',
    area: 'escrow',
    title: 'Escrow deposit indexing',
    status: 'implemented',
    summary: 'Track escrow deposits and notify the exporter when funds are locked.',
    contractEvents: ['EscrowDeposited'],
  },
  {
    id: 'document-ipfs-upload',
    area: 'document',
    title: 'Document upload and hash generation',
    status: 'implemented',
    summary: 'Accept PDF/JPEG/PNG documents, compute a SHA-256 hash, and pin them to IPFS.',
    apiRoutes: ['POST /documents/upload', 'GET /documents/:tradeId'],
  },
  {
    id: 'participant-read-model',
    area: 'registry',
    title: 'Participant read model',
    status: 'implemented',
    summary: 'Expose indexed participant records for client lookups.',
    apiRoutes: ['GET /participants/:address'],
  },
  {
    id: 'document-onchain-indexing',
    area: 'document',
    title: 'On-chain document submission indexing',
    status: 'planned',
    summary: 'Persist document submission events emitted by the Soroban document contract.',
    contributorHint: 'Wire DocumentSubmitted events to the existing Document table and add malformed-event tests.',
    contractEvents: ['DocumentSubmitted'],
  },
  {
    id: 'document-signature-verification',
    area: 'document',
    title: 'Document signature verification',
    status: 'planned',
    summary: 'Track document signatures and mark documents verified only after required approvals.',
    contributorHint: 'Replace optimistic verification with signer accumulation and required-count checks.',
    contractEvents: ['DocumentSigned'],
  },
  {
    id: 'settlement-release',
    area: 'trade',
    title: 'Settlement and escrow release mirror',
    status: 'planned',
    summary: 'Index successful settlement after documents are verified and escrow is released.',
    contributorHint: 'Enable after the trade contract calls document verification and escrow release cross-contract.',
    contractEvents: ['TradeSettled'],
  },
  {
    id: 'cancellation-refund',
    area: 'trade',
    title: 'Cancellation and refund mirror',
    status: 'planned',
    summary: 'Index trade cancellation and escrow refund outcomes.',
    contributorHint: 'Add state transition tests for cancellation before enabling this handler.',
    contractEvents: ['TradeCancelled'],
  },
  {
    id: 'expiry-monitoring',
    area: 'operations',
    title: 'Expiry monitoring and expiry event indexing',
    status: 'planned',
    summary: 'Warn on expiring trades and mirror on-chain expiry events.',
    contributorHint: 'Define current-ledger sourcing and duplicate-warning policy before running this in production.',
    contractEvents: ['TradeExpired'],
  },
  {
    id: 'registry-authorisation-indexing',
    area: 'registry',
    title: 'Registry authorization enforcement mirror',
    status: 'planned',
    summary: 'Index participant registration/revocation and expose role authorization decisions.',
    contributorHint: 'Add registry event handlers once the contract emits participant lifecycle events.',
  },
];

export const implementedProtocolCapabilities = protocolCapabilities.filter(
  (capability) => capability.status === 'implemented'
);

export const plannedProtocolCapabilities = protocolCapabilities.filter(
  (capability) => capability.status === 'planned'
);

export const PROTOCOL_IMPLEMENTATION_PERCENTAGE = Math.round(
  (implementedProtocolCapabilities.length / protocolCapabilities.length) * 100
);

const implementedEvents = new Set(
  implementedProtocolCapabilities.flatMap((capability) => capability.contractEvents ?? [])
);

export function isProtocolEventImplemented(eventType: string): boolean {
  return implementedEvents.has(eventType);
}

export function getProtocolCapabilitySummary() {
  return {
    implementationPercentage: PROTOCOL_IMPLEMENTATION_PERCENTAGE,
    implementedCount: implementedProtocolCapabilities.length,
    totalCount: protocolCapabilities.length,
    implemented: implementedProtocolCapabilities,
    planned: plannedProtocolCapabilities,
  };
}
