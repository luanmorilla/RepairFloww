import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("asaas-access-token");
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const evento = await request.json();
    const tipo = evento.event;
    const pagamento = evento.payment;

    let shopId = pagamento?.externalReference;

    if (!shopId && pagamento?.subscription) {
      const shop = await prisma.shop.findFirst({
        where: { asaasSubscriptionId: pagamento.subscription },
      });
      shopId = shop?.id;
    }

    if (!shopId) return NextResponse.json({ received: true });

    switch (tipo) {
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

      case "PAYMENT_OVERDUE": {
        // PAYMENT_OVERDUE chega antes e depois do pagamento PIX
        // Só expira se o plano realmente não estiver ativo e dentro da validade
        const shop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { planStatus: true, planExpiresAt: true },
        });

        const aindaValido =
          shop?.planStatus === "active" &&
          shop?.planExpiresAt != null &&
          shop.planExpiresAt > new Date();

        if (!aindaValido) {
          await prisma.shop.update({
            where: { id: shopId },
            data: { planStatus: "expired" },
          });
        }
        break;
      }

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

async function getDiasPlano(shopId: string): Promise<number> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  return shop?.planType === "trimestral" ? 90 : 30;
}