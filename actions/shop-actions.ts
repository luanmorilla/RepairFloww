"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getShopSettings() {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { shop: true },
  });

  if (!user?.shop) throw new Error("Loja não encontrada");

  return user.shop;
}

export async function updateShopSettings(data: {
  name: string;
  phone: string;
  standardWarranty: number;
  logo?: string | null;
}) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user?.shopId) throw new Error("Loja não encontrada");

  await prisma.shop.update({
    where: { id: user.shopId },
    data: {
      name: data.name,
      phone: data.phone,
      standardWarranty: data.standardWarranty,
      ...(data.logo !== undefined && { logo: data.logo }),
    },
  });

  revalidatePath("/painel/configuracoes");
  return { success: true };
}