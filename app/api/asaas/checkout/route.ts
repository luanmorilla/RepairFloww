// app/api/asaas/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const PLANOS: Record<string, { valor: number; ciclo: string }> = {
  mensal:     { valor: 12.90, ciclo: "MONTHLY" },
  trimestral: { valor: 28.90, ciclo: "QUARTERLY" },
};

export async function POST(request: Request) {
  // ✅ Lê as envs DENTRO da função, nunca no topo do módulo
  const ASAAS_API = process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY || "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjY1NjAyZDJmLTM0YTktNGVkOC04NDI0LTM2OTkzZDZlNWY4Njo6JGFhY2hfMDVmZDU0MDEtNWQ2My00MDg1LThhZmYtN2NmODIxYjA5Nzg5";
  console.log("ASAAS_KEY valor:", ASAAS_KEY?.slice(0, 20));
  console.log("ASAAS_URL valor:", ASAAS_API);

  if (!ASAAS_KEY || !ASAAS_API) {
    console.error("❌ Variáveis de ambiente do Asaas não configuradas");
    return NextResponse.json({ error: "Configuração de pagamento ausente" }, { status: 500 });
  }

  try {
    const { tipo, metodo } = await request.json();

    const plano = PLANOS[tipo];
    if (!plano) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
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
    const redirectUrl = `${process.env.NEXTAUTH_URL}/painel/ativado`;

    // 1. Cria ou reutiliza cliente no Asaas
    let asaasCustomerId = user.shop.asaasCustomerId;
    if (!asaasCustomerId) {
      const clienteRes = await fetch(`${ASAAS_API}/customers`, {
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

      const clienteText = await clienteRes.text();
      console.log("ASAAS CLIENTE status:", clienteRes.status);
      console.log("ASAAS CLIENTE body:", clienteText);
      const customer = JSON.parse(clienteText);

      if (!customer.id) {
        return NextResponse.json({ error: "Erro ao criar cliente no Asaas" }, { status: 500 });
      }

      asaasCustomerId = customer.id;
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { asaasCustomerId },
      });
    }

    // 2. Cria assinatura
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const nextDueDate = amanha.toISOString().split("T")[0];
    const billingType = metodo === "pix" ? "PIX" : "CREDIT_CARD";

    const assinaturaRes = await fetch(`${ASAAS_API}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_KEY,
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType,
        value: plano.valor,
        nextDueDate,
        cycle: plano.ciclo,
        description: `RepairFlow - Plano ${tipo}`,
        externalReference: user.shop.id,
      }),
    });

    const assinaturaText = await assinaturaRes.text();
    console.log("ASAAS ASSINATURA status:", assinaturaRes.status);
    console.log("ASAAS ASSINATURA body:", assinaturaText);
    const subscription = JSON.parse(assinaturaText);

    if (!subscription.id) {
      return NextResponse.json({ error: "Erro ao criar assinatura" }, { status: 500 });
    }

    // 3. Salva assinatura no banco
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: {
        asaasSubscriptionId: subscription.id,
        planType: tipo,
      },
    });

    // 4. Busca a primeira cobrança
    const cobrancaRes = await fetch(
      `${ASAAS_API}/subscriptions/${subscription.id}/payments`,
      { headers: { "access_token": ASAAS_KEY } }
    );

    const cobrancaText = await cobrancaRes.text();
    console.log("ASAAS COBRANÇA status:", cobrancaRes.status);
    console.log("ASAAS COBRANÇA body:", cobrancaText);
    const cobrancas = JSON.parse(cobrancaText);
    const primeiraCobranca = cobrancas.data?.[0];

    if (!primeiraCobranca?.id) {
      return NextResponse.json({ error: "Não foi possível gerar cobrança" }, { status: 500 });
    }

    // 5. PIX: retorna QR Code
    if (metodo === "pix") {
      const pixRes = await fetch(
        `${ASAAS_API}/payments/${primeiraCobranca.id}/pixQrCode`,
        { headers: { "access_token": ASAAS_KEY } }
      );

      const pixText = await pixRes.text();
      console.log("ASAAS PIX status:", pixRes.status);
      console.log("ASAAS PIX body:", pixText);
      const pixData = JSON.parse(pixText);

      if (!pixData.payload) {
        return NextResponse.json({ error: "Erro ao gerar QR Code PIX" }, { status: 500 });
      }

      return NextResponse.json({
        metodo: "pix",
        paymentId: primeiraCobranca.id,
        qrCode: pixData.encodedImage,
        copiaCola: pixData.payload,
        valor: plano.valor,
      });
    }

    // 6. Cartão: configura redirectUrl e retorna link
    await fetch(`${ASAAS_API}/payments/${primeiraCobranca.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_KEY,
      },
      body: JSON.stringify({ redirectUrl }),
    });

    const linkPagamento = primeiraCobranca?.invoiceUrl;
    if (!linkPagamento) {
      return NextResponse.json({ error: "Erro ao gerar link de pagamento" }, { status: 500 });
    }

    return NextResponse.json({
      metodo: "cartao",
      url: linkPagamento,
    });

  } catch (error) {
    console.error("ERRO CHECKOUT ASAAS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}