-- CreateEnum
CREATE TYPE "ProductChangeType" AS ENUM ('UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ProductChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "billingRetryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastBillingFailureAt" TIMESTAMP(3),
ADD COLUMN "nextBillingRetryAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProductChangeRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "type" "ProductChangeType" NOT NULL,
    "status" "ProductChangeStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductChangeRequest_productId_idx" ON "ProductChangeRequest"("productId");

-- CreateIndex
CREATE INDEX "ProductChangeRequest_sellerId_idx" ON "ProductChangeRequest"("sellerId");

-- CreateIndex
CREATE INDEX "ProductChangeRequest_status_idx" ON "ProductChangeRequest"("status");

-- CreateIndex
CREATE INDEX "ProductChangeRequest_type_idx" ON "ProductChangeRequest"("type");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingRetryAt_idx" ON "Subscription"("nextBillingRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");

-- AddForeignKey
ALTER TABLE "ProductChangeRequest" ADD CONSTRAINT "ProductChangeRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductChangeRequest" ADD CONSTRAINT "ProductChangeRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductChangeRequest" ADD CONSTRAINT "ProductChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
