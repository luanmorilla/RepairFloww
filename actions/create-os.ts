"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createServiceOrderWithPricing(data: any, shopId: string) {
  const { customer, device, defect, partCost, isApple } = data;

  // 1. Motor de Precificação Automático (Baseado em mercado)
  // Mão de obra base definida pelo dono (ex: R$ 150,00)
  const maoDeObraBase = 150.00; 
  const appleMultiplier = isApple ? 1.25 : 1.0;
  
  // Cálculo: (Mão de obra + Custo Peça) * Fator Apple * Margem de 30%
  const suggestedPrice = (maoDeObraBase + Number(partCost)) * appleMultiplier * 1.30;
  const estimatedProfit = suggestedPrice - Number(partCost);

  // 2. Transação de Banco de Dados
  return await prisma.$transaction(async (tx) => {
    
    // Criação do cliente
    const newCustomer = await tx.customer.create({
      data: { 
        name: customer.name, 
        phone: customer.phone, 
        shopId 
      }
    });

    // Criação do aparelho
    const newDevice = await tx.device.create({
      data: { 
        brand: device.brand, 
        model: device.model, 
        customerId: newCustomer.id 
      }
    });

    // Criação da OS
    const newOs = await tx.serviceOrder.create({
      data: {
        shopId,
        customerId: newCustomer.id,
        deviceId: newDevice.id,
        defect: defect,
        status: "RECEIVED",
        servicePrice: suggestedPrice,
        totalPrice: suggestedPrice,
        profit: estimatedProfit,
        warrantyDays: 90,
        technicianId: "system"
      }
    });

    revalidatePath("/painel");
    return newOs;
  });
}
