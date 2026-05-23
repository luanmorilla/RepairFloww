"use server";
import { prisma } from "@/lib/prisma";

export async function fetchDashboardData(shopId: string) {
  const agora = new Date();

  const [total, emReparo, prontas, atrasadas, transacoes] = await Promise.all([
    // Total de OS
    prisma.serviceOrder.count({ where: { shopId } }),

    // Em reparo agora
    prisma.serviceOrder.count({ where: { shopId, status: "IN_REPAIR" } }),

    // Prontas aguardando retirada
    prisma.serviceOrder.count({ where: { shopId, status: "READY" } }),

    // Atrasadas: deadline passou e ainda não entregues/canceladas/prontas
    prisma.serviceOrder.count({
      where: {
        shopId,
        deadline: { lt: agora },
        status: {
          notIn: ["READY", "DELIVERED", "CANCELED"],
        },
      },
    }),

    // Faturamento total
    prisma.transaction.aggregate({
      where: { shopId, type: "INCOME" },
      _sum: { amount: true },
    }),
  ]);

  return {
    total,
    emReparo,
    prontas,
    atrasadas,
    faturamento: transacoes._sum.amount || 0,
  };
}

export async function fetchFaturamentoDiario(shopId: string, dias: number = 30) {
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));
  desde.setHours(0, 0, 0, 0);

  const transacoes = await prisma.transaction.findMany({
    where: {
      shopId,
      type: "INCOME",
      date: { gte: desde },
    },
    select: { amount: true, date: true },
    orderBy: { date: "asc" },
  });

  const diasMap: Record<string, number> = {};
  for (let i = 0; i < dias; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (dias - 1 - i));
    const key = d.toISOString().slice(0, 10);
    diasMap[key] = 0;
  }

  for (const t of transacoes) {
    const key = new Date(t.date).toISOString().slice(0, 10);
    if (key in diasMap) diasMap[key] += t.amount;
  }

  return Object.entries(diasMap).map(([date, total]) => ({ date, total }));
}