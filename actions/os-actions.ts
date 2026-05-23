"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOsList(shopId: string) {
  return await prisma.serviceOrder.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    include: { customer: true, device: true, repairType: true },
  });
}

export async function getOsById(id: string) {
  return await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      device: true,
      technician: true,
      shop: true,
      repairType: true,
    },
  });
}

export async function concluirOS(id: string, shopId: string) {
  const os = await prisma.serviceOrder.update({
    where: { id },
    data: { status: "DELIVERED" },
    include: { shop: true },
  });

  await prisma.transaction.create({
    data: {
      type: "INCOME",
      amount: os.totalPrice,
      description: `OS #${os.orderNumber} concluída`,
      shopId,
    },
  });

  revalidatePath("/painel");
  return os;
}

export async function iniciarReparo(id: string) {
  const os = await prisma.serviceOrder.update({
    where: { id },
    data: { status: "IN_REPAIR" },
  });

  revalidatePath("/painel");
  return os;
}