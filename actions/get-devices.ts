"use server";
import { prisma } from "@/lib/prisma";

export async function getDeviceModels() {
  return await prisma.deviceModel.findMany({
    orderBy: { brand: 'asc' },
  });
}

export async function getRepairTypes() {
  return await prisma.repairType.findMany({
    orderBy: { name: 'asc' },
  });
}
