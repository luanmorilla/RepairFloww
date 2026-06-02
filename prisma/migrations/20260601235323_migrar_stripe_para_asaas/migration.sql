/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "asaasCustomerIdSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'inactive';
