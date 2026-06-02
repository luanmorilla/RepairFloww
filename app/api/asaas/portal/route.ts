import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const ASAAS_API = "https://api.asaas.com/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY!;

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    });

    if (!user?.shop) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const { asaasSubscriptionId, asaasCustomerId } = user.shop;

    // ── 1. Tenta pegar a última fatura da assinatura ──────────────────
    if (asaasSubscriptionId) {
      const res = await fetch(
        `${ASAAS_API}/subscriptions/${asaasSubscriptionId}/payments?limit=1&offset=0`,
        { headers: { "access_token": ASAAS_KEY } }
      );
      const data = await res.json();
      const ultimaCobranca = data?.data?.[0];

      if (ultimaCobranca?.invoiceUrl) {
        return NextResponse.json({ url: ultimaCobranca.invoiceUrl });
      }

      // fallback: link direto da assinatura (invoice url no objeto)
      if (ultimaCobranca?.paymentLink) {
        return NextResponse.json({ url: ultimaCobranca.paymentLink });
      }
    }

    // ── 2. Fallback: lista cobranças pelo customerId ───────────────────
    if (asaasCustomerId) {
      const res = await fetch(
        `${ASAAS_API}/payments?customer=${asaasCustomerId}&limit=1&offset=0&status=PENDING`,
        { headers: { "access_token": ASAAS_KEY } }
      );
      const data = await res.json();
      const cobranca = data?.data?.[0];

      if (cobranca?.invoiceUrl) {
        return NextResponse.json({ url: cobranca.invoiceUrl });
      }
    }

    // ── 3. Último fallback: abre o Asaas direto (usuário loga lá) ─────
    return NextResponse.json({
      url: "https://www.asaas.com/login",
    });

  } catch (error) {
    console.error("ERRO PORTAL ASAAS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}