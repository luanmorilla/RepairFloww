/*
  Warnings:

  - You are about to drop the column `riskFactor` on the `DeviceModel` table. All the data in the column will be lost.
  - Added the required column `marketValue` to the `DeviceModel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeviceModel" DROP COLUMN "riskFactor",
ADD COLUMN     "marketValue" DECIMAL(65,30) NOT NULL;
