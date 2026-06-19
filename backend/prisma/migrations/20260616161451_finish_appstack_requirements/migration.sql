-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RefundStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "RefundStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "providerChargeRef" TEXT;

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "providerToken" TEXT;

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "providerPayoutRef" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "refundsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductPlan" ADD COLUMN     "refundsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RefundRequest" ADD COLUMN     "providerRefundRef" TEXT;

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);
