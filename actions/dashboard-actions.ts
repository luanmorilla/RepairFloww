"use server";
import { prisma } from "@/lib/prisma";

export async function fetchDashboardData(shopId: string) {
  const [total, emReparo, transacoes] = await Promise.all([
    prisma.serviceOrder.count({ where: { shopId } }),
    prisma.serviceOrder.count({ where: { shopId, status: "IN_REPAIR" } }),
    prisma.transaction.aggregate({
      where: { shopId, type: "INCOME" },
      _sum: { amount: true },
    }),
  ]);

  return {
    total,
    emReparo,
    faturamento: transacoes._sum.amount || 0,
  };
}