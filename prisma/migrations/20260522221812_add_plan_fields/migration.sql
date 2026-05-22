-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ADD COLUMN     "planStatus" TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN     "planType" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;
