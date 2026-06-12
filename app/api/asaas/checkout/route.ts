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
  const ASAAS_API = process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3";
  const ASAAS_KEY = process.env.ASAAS_API_KEY;

  if (!ASAAS_KEY) {
    console.error("❌ ASAAS_API_KEY não configurada nas variáveis de ambiente");
    return NextResponse.json(
      { error: "Configuração de pagamento ausente" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { tipo, metodo } = body;
    console.log("📦 Checkout recebido:", { tipo, metodo });

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
      console.error("❌ CPF ausente para o usuário:", user.email);
      return NextResponse.json(
        { error: "CPF/CNPJ não encontrado. Por favor, atualize seu cadastro." },
        { status: 400 }
      );
    }

    const cpfLimpo = user.cpfCnpj.replace(/\D/g, "");
    const redirectUrl = `${process.env.NEXTAUTH_URL}/painel/ativado`;

    let asaasCustomerId = user.shop.asaasCustomerId;

    const criarCliente = async () => {
      console.log("🆕 Criando novo cliente no Asaas...");
      const clienteRes = await fetch(`${ASAAS_API}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": ASAAS_KEY!,
        },
        body: JSON.stringify({
          name: user.name ?? user.email,
          email: user.email,
          externalReference: user.shop!.id,
          cpfCnpj: cpfLimpo,
        }),
      });

      const clienteText = await clienteRes.text();
      console.log("ASAAS CLIENTE status:", clienteRes.status);

      if (!clienteRes.ok) {
        throw new Error("Erro ao criar cliente no Asaas");
      }

      const customer = JSON.parse(clienteText);
      if (!customer.id) {
        throw new Error("Erro ao criar cliente no Asaas: ID ausente");
      }

      await prisma.shop.update({
        where: { id: user.shop!.id },
        data: { asaasCustomerId: customer.id },
      });

      console.log("✅ Cliente Asaas criado:", customer.id);
      return customer.id as string;
    };

    if (!asaasCustomerId) {
      asaasCustomerId = await criarCliente();
    } else {
      console.log("♻️ Reutilizando cliente:", asaasCustomerId);
    }

    if (user.shop.asaasSubscriptionId) {
      console.log("🔄 Cancelando assinatura anterior:", user.shop.asaasSubscriptionId);
      try {
        await fetch(`${ASAAS_API}/subscriptions/${user.shop.asaasSubscriptionId}`, {
          method: "DELETE",
          headers: { "access_token": ASAAS_KEY },
        });
      } catch (e) {
        console.warn("⚠️ Não foi possível cancelar assinatura anterior:", e);
      }
    }

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const nextDueDate = amanha.toISOString().split("T")[0];
    const billingType = metodo === "pix" ? "PIX" : "CREDIT_CARD";

    console.log("📝 Criando assinatura:", { customer: asaasCustomerId, billingType, value: plano.valor });

    const criarAssinatura = async (customerId: string) => {
      return fetch(`${ASAAS_API}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": ASAAS_KEY!,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType,
          value: plano.valor,
          nextDueDate,
          cycle: plano.ciclo,
          description: `RepairFlow - Plano ${tipo}`,
          externalReference: user.shop!.id,
        }),
      });
    };

    let assinaturaRes = await criarAssinatura(asaasCustomerId);
    let assinaturaText = await assinaturaRes.text();
    console.log("ASAAS ASSINATURA status:", assinaturaRes.status);

    if (assinaturaRes.status === 400) {
      const errBody = JSON.parse(assinaturaText);
      const clienteRemovido = errBody.errors?.some((e: any) => e.code === "invalid_object");

      if (clienteRemovido) {
        console.log("⚠️ Cliente removido no Asaas, recriando...");

        await prisma.shop.update({
          where: { id: user.shop.id },
          data: { asaasCustomerId: null, asaasSubscriptionId: null },
        });

        asaasCustomerId = await criarCliente();
        assinaturaRes = await criarAssinatura(asaasCustomerId);
        assinaturaText = await assinaturaRes.text();
        console.log("ASAAS ASSINATURA (retry) status:", assinaturaRes.status);
      }
    }

    if (!assinaturaRes.ok) {
      return NextResponse.json({ error: "Erro ao criar assinatura no Asaas" }, { status: 500 });
    }

    const subscription = JSON.parse(assinaturaText);
    if (!subscription.id) {
      return NextResponse.json({ error: "Erro ao criar assinatura" }, { status: 500 });
    }

    await prisma.shop.update({
      where: { id: user.shop.id },
      data: { asaasSubscriptionId: subscription.id, planType: tipo },
    });
    console.log("✅ Assinatura salva:", subscription.id);

    await new Promise((r) => setTimeout(r, 1000));

    const cobrancaRes = await fetch(
      `${ASAAS_API}/subscriptions/${subscription.id}/payments`,
      { headers: { "access_token": ASAAS_KEY } }
    );

    const cobrancaText = await cobrancaRes.text();
    console.log("ASAAS COBRANÇA status:", cobrancaRes.status);

    if (!cobrancaRes.ok) {
      return NextResponse.json({ error: "Erro ao buscar cobrança" }, { status: 500 });
    }

    const cobrancas = JSON.parse(cobrancaText);
    const primeiraCobranca = cobrancas.data?.[0];

    if (!primeiraCobranca?.id) {
      console.error("❌ Nenhuma cobrança encontrada:", cobrancas);
      return NextResponse.json({ error: "Não foi possível gerar cobrança" }, { status: 500 });
    }

    console.log("✅ Cobrança:", primeiraCobranca.id, "status:", primeiraCobranca.status);

    if (metodo === "pix") {
      const pixRes = await fetch(
        `${ASAAS_API}/payments/${primeiraCobranca.id}/pixQrCode`,
        { headers: { "access_token": ASAAS_KEY } }
      );

      const pixText = await pixRes.text();
      console.log("ASAAS PIX status:", pixRes.status);

      if (!pixRes.ok) {
        return NextResponse.json({ error: "Erro ao gerar QR Code PIX" }, { status: 500 });
      }

      const pixData = JSON.parse(pixText);
      if (!pixData.payload) {
        console.error("❌ PIX sem payload:", pixData);
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

    await fetch(`${ASAAS_API}/payments/${primeiraCobranca.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "access_token": ASAAS_KEY },
      body: JSON.stringify({ redirectUrl }),
    });

    const linkPagamento = primeiraCobranca?.invoiceUrl;
    if (!linkPagamento) {
      console.error("❌ invoiceUrl ausente:", primeiraCobranca);
      return NextResponse.json({ error: "Erro ao gerar link de pagamento" }, { status: 500 });
    }

    return NextResponse.json({ metodo: "cartao", url: linkPagamento });

  } catch (error: any) {
    console.error("🔥 ERRO INESPERADO NO CHECKOUT:", error?.message ?? error);
    console.error("Stack:", error?.stack);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}