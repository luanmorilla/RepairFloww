/*
  Warnings:

  - You are about to drop the column `asaasCustomerIdSubscriptionId` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "asaasCustomerIdSubscriptionId",
ADD COLUMN     "asaasSubscriptionId" TEXT;
