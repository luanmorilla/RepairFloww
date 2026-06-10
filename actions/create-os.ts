/**
 * actions/create-os.ts
 * Server action para criação de Ordem de Serviço com precificação validada.
 *
 * Segurança: o preço final é SEMPRE recalculado no servidor.
 * O valor enviado pelo frontend é descartado e reconstruído a partir
 * dos inputs brutos, impossibilitando manipulação via DevTools.
 */

"use server";

import { prisma }           from "@/lib/prisma";
import { revalidatePath }   from "next/cache";
import { calcularPrecoBase } from "@/lib/pricing-engine";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface CustomerInput {
  name:  string;
  phone: string;
}

type PricingMode = "auto" | "manual";

interface CreateOsPayload {
  customer:          CustomerInput;
  deviceId:          string;
  repairTypeId:      string;
  defectDescription: string;
  partCost:          number;
  pricingMode:       PricingMode;
  /** Preenchido apenas no modo manual */
  manualPrice:       number | null;
  /** Valor do desconto em R$ já calculado (validado e reaplicado no servidor) */
  discountAmount:    number;
  /** Ignorado internamente — preço é recalculado no servidor */
  finalPrice?:       number;
}

// ─── Action principal ──────────────────────────────────────────────────────────

export async function createServiceOrderWithPricing(
  data:   CreateOsPayload,
  shopId: string
) {
  const {
    customer,
    deviceId,
    repairTypeId,
    defectDescription,
    partCost,
    pricingMode,
    manualPrice,
    discountAmount,
  } = data;

  // ── Validações de entrada ──────────────────────────────────────────────────

  if (!customer?.name?.trim()) {
    throw new Error("Nome do cliente é obrigatório.");
  }
  if (!customer?.phone?.trim()) {
    throw new Error("Telefone do cliente é obrigatório.");
  }
  if (!deviceId || !repairTypeId) {
    throw new Error("Aparelho e serviço são obrigatórios.");
  }
  if (pricingMode === "manual") {
    if (!manualPrice || manualPrice <= 0) {
      throw new Error("Informe um valor válido para o serviço no modo manual.");
    }
  }

  const partCostSafe    = Math.max(0, Number(partCost)    || 0);
  const discountSafe    = Math.max(0, Number(discountAmount) || 0);

  // ── Busca catálogo ─────────────────────────────────────────────────────────

  const [modelCatalog, repairCatalog] = await Promise.all([
    prisma.deviceModel.findUnique({ where: { id: deviceId } }),
    prisma.repairType.findUnique({ where: { id: repairTypeId } }),
  ]);

  if (!modelCatalog) {
    throw new Error("Aparelho não encontrado no catálogo.");
  }
  if (!repairCatalog) {
    throw new Error("Tipo de reparo não encontrado no catálogo.");
  }

  // ── Recálculo seguro do preço no servidor ──────────────────────────────────
  // O frontend envia apenas os inputs brutos.
  // O preço efetivo é sempre calculado aqui, nunca confiado ao cliente.

  let effectivePrice: number;

  if (pricingMode === "manual") {
    // Modo manual: usa o valor informado pelo técnico
    effectivePrice = Number(manualPrice);
  } else {
    // Modo automático: recalcula via engine com os mesmos inputs do frontend
    const engineResult = calcularPrecoBase({
      marketValue: Number(modelCatalog.marketValue),
      difficulty:  repairCatalog.difficulty,
      partCost:    partCostSafe,
      // perfil poderia vir da configuração da loja no futuro
      perfil:      "equilibrado",
    });
    effectivePrice = engineResult.subtotal;
  }

  // Aplica desconto com proteção — desconto nunca pode zerar o preço
  const discountApplied = Math.min(discountSafe, effectivePrice * 0.50); // máx 50%
  const finalPrice      = Math.max(0, effectivePrice - discountApplied);
  const profit          = Math.max(0, finalPrice - partCostSafe);

  // ── Transação atômica no banco ─────────────────────────────────────────────

  return await prisma.$transaction(async (tx) => {
    // Valida loja
    const shop = await tx.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new Error("Loja não encontrada. Faça login novamente.");
    }

    // Cria cliente
    const newCustomer = await tx.customer.create({
      data: {
        name:   customer.name.trim(),
        phone:  customer.phone.trim(),
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

    // Monta descrição do defeito
    const defectText = [
      repairCatalog.name,
      defectDescription?.trim() || null,
    ]
      .filter(Boolean)
      .join(" — ");

    // Cria OS
    const newOs = await tx.serviceOrder.create({
      data: {
        shopId,
        customerId:    newCustomer.id,
        deviceId:      newDevice.id,
        repairTypeId:  repairCatalog.id,
        defect:        defectText,
        notes:         defectDescription?.trim() || null,
        status:        "RECEIVED",
        estimatedCost: partCostSafe,
        servicePrice:  finalPrice,
        totalPrice:    finalPrice,
        profit,
        warrantyDays:  shop.standardWarranty,
        pricingMode,
        manualPrice:   pricingMode === "manual" ? Number(manualPrice) : null,
      },
    });

    revalidatePath("/painel");
    return newOs;
  });
}