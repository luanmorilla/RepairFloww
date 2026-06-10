-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "manualPrice" DOUBLE PRECISION,
ADD COLUMN     "pricingMode" TEXT NOT NULL DEFAULT 'auto';
