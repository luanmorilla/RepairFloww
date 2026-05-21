import { prisma } from "@/lib/prisma";

export async function getDashboardStats(shopId: string) {
  // Buscamos tudo de forma paralela para o painel carregar instantaneamente
  const [totalOrdens, emReparo, faturamento] = await Promise.all([
    prisma.serviceOrder.count({ where: { shopId } }),
    prisma.serviceOrder.count({ where: { shopId, status: "IN_REPAIR" } }),
    prisma.serviceOrder.aggregate({
      where: { shopId, status: "DELIVERED" },
      _sum: { totalPrice: true }
    })
  ]);

  return {
    totalOrdens,
    emReparo,
    faturamento: faturamento._sum.totalPrice || 0
  };
}

export async function getRecentOrders(shopId: string) {
  return await prisma.serviceOrder.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { customer: true, device: true } // Puxa os dados do cliente e aparelho juntos
  });
}