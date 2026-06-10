"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createServiceOrderWithPricing(data: any, shopId: string) {
  const {
    customer,
    deviceId,
    repairTypeId,
    defectDescription,
    partCost,
    pricingMode,
    manualPrice,
    discountAmount,
    finalPrice,
  } = data;

  // 1. Valida catálogo
  const [modelCatalog, repairCatalog] = await Promise.all([
    prisma.deviceModel.findUnique({ where: { id: deviceId } }),
    prisma.repairType.findUnique({ where: { id: repairTypeId } }),
  ]);

  if (!modelCatalog || !repairCatalog) {
    throw new Error("Aparelho ou tipo de reparo não encontrado no catálogo.");
  }

  // 2. Mão de obra por dificuldade (preservada intacta)
  let maoDeObraBase = 100.0;
  if (repairCatalog.difficulty === "Média")      maoDeObraBase = 160.0;
  if (repairCatalog.difficulty === "Alta")       maoDeObraBase = 250.0;
  if (repairCatalog.difficulty === "Muito Alta") maoDeObraBase = 450.0;

  // 3. Taxa de risco baseada no valor de mercado (preservada intacta)
  const deviceValue = Number(modelCatalog.marketValue);
  const taxaRisco   = deviceValue * (deviceValue > 5000 ? 0.06 : 0.04);

  // 4. Preço automático (lógica original preservada como fallback)
  const autoPrice = maoDeObraBase + Number(partCost) + taxaRisco;

  // 5. Decide qual preço salvar
  //    "manual" → usa o valor digitado pelo técnico
  //    "auto"   → usa o finalPrice já calculado pela página (Gemini + desconto)
  const isManual       = pricingMode === "manual";
  const effectivePrice = isManual
    ? Number(manualPrice)
    : Number(finalPrice ?? autoPrice);
  const effectiveProfit = effectivePrice - Number(partCost);

  // 6. Transação no banco
  return await prisma.$transaction(async (tx) => {

    // Garante que a loja existe
    const shopExists = await tx.shop.findUnique({ where: { id: shopId } });
    if (!shopExists) {
      throw new Error(`Loja "${shopId}" não encontrada. Verifique o login.`);
    }

    // Cria cliente
    const newCustomer = await tx.customer.create({
      data: {
        name:   String(customer.name),
        phone:  String(customer.phone),
        shopId,
      },
    });

    // Cria aparelho vinculado ao cliente
    const newDevice = await tx.device.create({
      data: {
        brand:      modelCatalog.brand,
        model:      modelCatalog.model,
        customerId: newCustomer.id,
      },
    });

    // Cria OS
    const newOs = await tx.serviceOrder.create({
      data: {
        shopId,
        customerId:   newCustomer.id,
        deviceId:     newDevice.id,
        repairTypeId: repairCatalog.id,
        defect:       repairCatalog.name + (defectDescription ? ` - ${defectDescription}` : ""),
        notes:        defectDescription ? String(defectDescription) : null,
        status:       "RECEIVED",
        servicePrice:  effectivePrice,
        totalPrice:    effectivePrice,
        profit:        effectiveProfit,
        warrantyDays:  shopExists.standardWarranty,
        pricingMode:   isManual ? "manual" : "auto",
        manualPrice:   isManual ? Number(manualPrice) : null,
      },
    });

    revalidatePath("/painel");
    return newOs;
  });
}