"use server";
import { prisma } from "@/lib/prisma";

export async function getOsList(shopId: string) {
  return await prisma.serviceOrder.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    include: { customer: true, device: true },
  });
}