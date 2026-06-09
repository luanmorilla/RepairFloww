// app/api/asaas/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const ASAAS_API = "https://api.asaas.com/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY!;

const PLANOS: Record<string, { valor: number; ciclo: string }> = {
  mensal:     { valor: 12.90, ciclo: "MONTHLY" },
  trimestral: { valor: 28.90, ciclo: "QUARTERLY" },
};

export async function POST(request: Request) {
  try {
    const { tipo } = await request.json();
    const plano = PLANOS[tipo];
    if (!plano) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

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

    if (!user.cpfCnpj) {
      return NextResponse.json(
        { error: "CPF não encontrado. Por favor, atualize seu cadastro." },
        { status: 400 }
      );
    }

    const cpfLimpo = user.cpfCnpj.replace(/\D/g, "");

    // URL que o Asaas exibe como botão "Voltar ao site" após confirmação
    const successUrl = `${process.env.NEXTAUTH_URL}/painel/ativado`;

    // 1. Cria ou reutiliza cliente no Asaas
    let asaasCustomerId = user.shop.asaasCustomerId;
    if (!asaasCustomerId) {
      const res = await fetch(`${ASAAS_API}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": ASAAS_KEY,
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          externalReference: user.shop.id,
          cpfCnpj: cpfLimpo,
        }),
      });
      const customer = await res.json();

      if (!customer.id) {
        console.error("Erro Asaas (cliente):", customer);
        return NextResponse.json({ error: "Erro ao criar cliente no Asaas" }, { status: 500 });
      }

      asaasCustomerId = customer.id;

      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { asaasCustomerId },
      });
    }

    // 2. Cria assinatura no Asaas
    const hoje = new Date().toISOString().split("T")[0];
    const res = await fetch(`${ASAAS_API}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_KEY,
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "UNDEFINED",
        value: plano.valor,
        nextDueDate: hoje,
        cycle: plano.ciclo,
        description: `RepairFlow - Plano ${tipo}`,
        externalReference: user.shop.id,
      }),
    });

    const subscription = await res.json();

    if (!subscription.id) {
      console.error("Erro Asaas:", subscription);
      return NextResponse.json({ error: "Erro ao criar assinatura" }, { status: 500 });
    }

    // 3. Salva ID da assinatura e tipo do plano no banco
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: {
        asaasSubscriptionId: subscription.id,
        planType: tipo,
      },
    });

    // 4. Busca a primeira cobrança da assinatura
    const cobrancaRes = await fetch(
      `${ASAAS_API}/subscriptions/${subscription.id}/payments`,
      { headers: { "access_token": ASAAS_KEY } }
    );
    const cobrancas = await cobrancaRes.json();
    const primeiraCobranca = cobrancas.data?.[0];

    if (!primeiraCobranca?.id) {
      return NextResponse.json({ error: "Não foi possível gerar o link de pagamento" }, { status: 500 });
    }

    // 5. Atualiza a cobrança com successUrl (botão "Voltar ao site" no checkout)
    //    e redirectUrl (redirect automático em cartão/boleto)
    await fetch(`${ASAAS_API}/payments/${primeiraCobranca.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_KEY,
      },
      body: JSON.stringify({
        successUrl,      // ← exibe botão "Voltar ao site" após confirmação (funciona no PIX)
        redirectUrl: successUrl, // ← redirect automático (funciona em cartão/boleto)
      }),
    });

    const linkPagamento = primeiraCobranca?.invoiceUrl;

    if (!linkPagamento) {
      return NextResponse.json({ error: "Não foi possível gerar o link de pagamento" }, { status: 500 });
    }

    return NextResponse.json({ url: linkPagamento });
  } catch (error) {
    console.error("ERRO CHECKOUT ASAAS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}