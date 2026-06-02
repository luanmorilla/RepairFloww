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

    // Verifica se o usuário tem CPF cadastrado
    if (!user.cpfCnpj) {
      return NextResponse.json(
        { error: "CPF não encontrado. Por favor, atualize seu cadastro." },
        { status: 400 }
      );
    }

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
          cpfCnpj: user.cpfCnpj, // CPF vem do banco, salvo no cadastro
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
        billingType: "UNDEFINED", // cliente escolhe: Pix, boleto ou cartão
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

    // 3. Salva o ID da assinatura
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: { asaasSubscriptionId: subscription.id },
    });

    // 4. Pega o link de pagamento da primeira cobrança
    const cobrancaRes = await fetch(
      `${ASAAS_API}/subscriptions/${subscription.id}/payments`,
      { headers: { "access_token": ASAAS_KEY } }
    );
    const cobrancas = await cobrancaRes.json();
    const primeiraCobranca = cobrancas.data?.[0];
    const linkPagamento = primeiraCobranca?.invoiceUrl;

    return NextResponse.json({ url: linkPagamento });
  } catch (error) {
    console.error("ERRO CHECKOUT ASAAS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}