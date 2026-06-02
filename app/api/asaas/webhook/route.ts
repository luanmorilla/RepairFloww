import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Valida token de segurança
    const token = request.headers.get("asaas-access-token");
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const evento = await request.json();
    const tipo = evento.event;
    const pagamento = evento.payment;
    const shopId = pagamento?.externalReference;

    if (!shopId) return NextResponse.json({ received: true });

    switch (tipo) {
      // ✅ Pagamento confirmado
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        const diasPlano = await getDiasPlano(shopId);
        const expira = new Date();
        expira.setDate(expira.getDate() + diasPlano);

        await prisma.shop.update({
          where: { id: shopId },
          data: {
            planStatus: "active",
            planExpiresAt: expira,
          },
        });
        break;
      }

      // ❌ Pagamento atrasado ou cancelado
      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
      case "SUBSCRIPTION_INACTIVATED": {
        await prisma.shop.update({
          where: { id: shopId },
          data: { planStatus: "expired" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("ERRO WEBHOOK ASAAS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Descobre quantos dias tem o plano atual da loja
async function getDiasPlano(shopId: string): Promise<number> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  return shop?.planType === "trimestral" ? 90 : 30;
}