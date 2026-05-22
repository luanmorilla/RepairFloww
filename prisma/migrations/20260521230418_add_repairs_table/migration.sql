/*
  Warnings:

  - You are about to alter the column `marketValue` on the `DeviceModel` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "DeviceModel" ALTER COLUMN "marketValue" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "repairTypeId" TEXT;

-- CreateTable
CREATE TABLE "RepairType" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,

    CONSTRAINT "RepairType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_repairTypeId_fkey" FOREIGN KEY ("repairTypeId") REFERENCES "RepairType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
