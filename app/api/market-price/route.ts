/**
 * app/api/market-price/route.ts
 * Rota de precificação — RepairFlow
 *
 * Fluxo:
 *   1. Valida inputs
 *   2. Busca marketValue do aparelho e difficulty do serviço no banco
 *   3. Calcula preço via engine com os dados reais cadastrados
 *   4. Retorna adjustedPrice
 *
 * Sem IA, sem API externa, sem rate limit.
 */

import { NextResponse }                                                 from "next/server";
import { prisma }                                                       from "@/lib/prisma";
import { calcularPrecoBase, type PerfilAssistencia }                    from "@/lib/pricing-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const deviceId: string = String(body.deviceId ?? "");
    const repairId: string = String(body.repairId ?? "");
    const partCost:  number            = Number(body.partCost)  || 0;
    const perfil:    PerfilAssistencia = body.perfil ?? "equilibrado";

    if (!deviceId || !repairId) {
      return NextResponse.json(
        { success: false, error: "deviceId e repairId são obrigatórios." },
        { status: 400 }
      );
    }

    // Busca aparelho e serviço no banco em paralelo
    const [device, repair] = await Promise.all([
      prisma.deviceModel.findUnique({ where: { id: deviceId } }),
      prisma.repairType.findUnique({ where: { id: repairId } }),
    ]);

    if (!device) {
      return NextResponse.json(
        { success: false, error: "Aparelho não encontrado." },
        { status: 404 }
      );
    }

    if (!repair) {
      return NextResponse.json(
        { success: false, error: "Tipo de reparo não encontrado." },
        { status: 404 }
      );
    }

    // Engine calcula com os dados reais cadastrados
    const result = calcularPrecoBase({
      marketValue: device.marketValue,
      difficulty:  repair.difficulty,
      partCost,
      perfil,
    });

    return NextResponse.json({
      success:      true,
      adjustedPrice: Math.round(result.subtotal),
      breakdown: {
        maoDeObra:            result.maoDeObra,
        taxaRisco:            result.taxaRisco,
        taxaResponsabilidade: result.taxaResponsabilidade,
        categoriaAparelho:    result.categoriaAparelho,
        pisoAbsoluto:         result.pisoAbsoluto,
      },
    });

  } catch (error) {
    console.error("[market-price] Erro:", error);
    return NextResponse.json(
      { success: false, adjustedPrice: null },
      { status: 500 }
    );
  }
}