-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PendingEscrow', 'Active', 'DocumentsPending', 'Settled', 'Cancelled', 'Expired');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('BillOfLading', 'CertificateOfOrigin', 'InspectionCertificate', 'PhytosanitaryCertificate', 'CustomsDeclaration');

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "exporter" TEXT NOT NULL,
    "importer" TEXT NOT NULL,
    "issuingBank" TEXT,
    "confirmingBank" TEXT,
    "asset" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL,
    "requiredDocs" "DocType"[],
    "expiryLedger" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "hash" TEXT NOT NULL,
    "ipfsCid" TEXT,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "signers" TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeEvent" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actor" TEXT,
    "meta" JSONB,
    "ledger" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "address" TEXT NOT NULL,
    "participantType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "NotificationSubscription" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tradeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerCursor" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cursor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_exporter_idx" ON "Trade"("exporter");

-- CreateIndex
CREATE INDEX "Trade_importer_idx" ON "Trade"("importer");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "Trade_expiryLedger_idx" ON "Trade"("expiryLedger");

-- CreateIndex
CREATE INDEX "Document_tradeId_idx" ON "Document"("tradeId");

-- CreateIndex
CREATE INDEX "Document_submittedBy_idx" ON "Document"("submittedBy");

-- CreateIndex
CREATE INDEX "TradeEvent_tradeId_idx" ON "TradeEvent"("tradeId");

-- CreateIndex
CREATE INDEX "TradeEvent_eventType_idx" ON "TradeEvent"("eventType");

-- CreateIndex
CREATE INDEX "TradeEvent_timestamp_idx" ON "TradeEvent"("timestamp");

-- CreateIndex
CREATE INDEX "Participant_participantType_idx" ON "Participant"("participantType");

-- CreateIndex
CREATE INDEX "Participant_active_idx" ON "Participant"("active");

-- CreateIndex
CREATE INDEX "NotificationSubscription_address_idx" ON "NotificationSubscription"("address");

-- CreateIndex
CREATE INDEX "NotificationSubscription_tradeId_idx" ON "NotificationSubscription"("tradeId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeEvent" ADD CONSTRAINT "TradeEvent_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
