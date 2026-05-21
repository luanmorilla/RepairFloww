"use server";
import { prisma } from "@/lib/prisma";

export async function fetchDashboardData(shopId: string) {
  const [total, emReparo, faturamento] = await Promise.all([
    prisma.serviceOrder.count({ where: { shopId } }),
    prisma.serviceOrder.count({ where: { shopId, status: "IN_REPAIR" } }),
    prisma.serviceOrder.aggregate({
      where: { shopId, status: "DELIVERED" },
      _sum: { totalPrice: true }
    })
  ]);

  return { total, emReparo, faturamento: faturamento._sum.totalPrice || 0 };
}
