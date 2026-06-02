import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Senha secreta para ativar — troca para algo só seu!
const ADMIN_SECRET = process.env.ADMIN_SECRET || "repairflow-admin-2026";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const senha = searchParams.get("senha");
    const shopId = searchParams.get("shop");

    // Verifica a senha
    if (senha !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Se não passou shopId, lista todas as lojas
    if (!shopId) {
      const shops = await prisma.shop.findMany({
        select: {
          id: true,
          name: true,
          planStatus: true,
          planType: true,
        },
      });
      return NextResponse.json({ shops });
    }

    // Ativa o plano da loja
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        planStatus: "active",
        planType: "mensal",
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    return NextResponse.json({
      success: true,
      message: `Loja "${shop.name}" ativada com sucesso!`,
      shop: {
        id: shop.id,
        name: shop.name,
        planStatus: shop.planStatus,
        planExpiresAt: shop.planExpiresAt,
      },
    });
  } catch (error) {
    console.error("ERRO ADMIN ATIVAR:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}