"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStockItems(shopId: string) {
  return await prisma.stockItem.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
  });
}

export async function createStockItem(data: {
  name: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  shopId: string;
  barcode?: string;
  minQuantity?: number;
}) {
  const item = await prisma.stockItem.create({
    data: {
      name: data.name,
      category: data.category as any,
      quantity: data.quantity,
      costPrice: data.costPrice,
      sellPrice: data.sellPrice,
      shopId: data.shopId,
      barcode: data.barcode,
      minQuantity: data.minQuantity ?? 2,
    },
  });
  revalidatePath("/painel");
  return item;
}

export async function updateStockItem(id: string, data: Partial<{
  name: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  minQuantity: number; // ← adicionado
}>) {
  const item = await prisma.stockItem.update({ where: { id }, data });
  revalidatePath("/painel");
  return item;
}

export async function deleteStockItem(id: string) {
  await prisma.stockItem.delete({ where: { id } });
  revalidatePath("/painel");
}

export async function vendaRapida(itemId: string, quantidade: number, shopId: string) {
  const item = await prisma.stockItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Produto não encontrado");
  if (item.quantity < quantidade) throw new Error("Estoque insuficiente");

  const lucro = (item.sellPrice - item.costPrice) * quantidade;
  const total = item.sellPrice * quantidade;

  await prisma.stockItem.update({
    where: { id: itemId },
    data: { quantity: item.quantity - quantidade },
  });

  await prisma.transaction.create({
    data: {
      type: "INCOME",
      amount: total,
      description: `Venda rápida: ${quantidade}x ${item.name}`,
      shopId,
    },
  });

  revalidatePath("/painel");
  return { lucro, total };
}