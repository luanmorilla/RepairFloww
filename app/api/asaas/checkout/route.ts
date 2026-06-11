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

  // ── Guarda de variáveis de ambiente ──────────────────────────────────────
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

    // ── Valida plano ──────────────────────────────────────────────────────
    const plano = PLANOS[tipo];
    if (!plano) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    // ── Valida sessão ─────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // ── Busca usuário e loja ──────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    });

    console.log("👤 Usuário encontrado:", {
      id: user?.id,
      email: user?.email,
      temShop: !!user?.shop,
      cpfCnpj: user?.cpfCnpj ? "✅ presente" : "❌ ausente",
      asaasCustomerId: user?.shop?.asaasCustomerId ?? "não cadastrado",
    });

    if (!user?.shop) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    // ── Guarda de CPF ─────────────────────────────────────────────────────
    // ⚠️ Se cpfCnpj não existe no schema do Prisma, isso vai ser undefined,
    //    não null — ambos são tratados aqui.
    if (!user.cpfCnpj) {
      console.error("❌ CPF ausente para o usuário:", user.email);
      return NextResponse.json(
        { error: "CPF/CNPJ não encontrado. Por favor, atualize seu cadastro." },
        { status: 400 }
      );
    }

    const cpfLimpo = user.cpfCnpj.replace(/\D/g, "");
    const redirectUrl = `${process.env.NEXTAUTH_URL}/painel/ativado`;

    // ── 1. Cria ou reutiliza cliente no Asaas ─────────────────────────────
    let asaasCustomerId = user.shop.asaasCustomerId;

    if (!asaasCustomerId) {
      console.log("🆕 Criando novo cliente no Asaas...");

      const clienteRes = await fetch(`${ASAAS_API}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": ASAAS_KEY,
        },
        body: JSON.stringify({
          name: user.name ?? user.email,
          email: user.email,
          externalReference: user.shop.id,
          cpfCnpj: cpfLimpo,
        }),
      });

      const clienteText = await clienteRes.text();
      console.log("ASAAS CLIENTE status:", clienteRes.status);
      console.log("ASAAS CLIENTE body:", clienteText);

      if (!clienteRes.ok) {
        console.error("❌ Falha ao criar cliente no Asaas:", clienteText);
        return NextResponse.json(
          { error: "Erro ao criar cliente no Asaas" },
          { status: 500 }
        );
      }

      const customer = JSON.parse(clienteText);

      if (!customer.id) {
        console.error("❌ Asaas não retornou ID de cliente:", customer);
        return NextResponse.json(
          { error: "Erro ao criar cliente no Asaas" },
          { status: 500 }
        );
      }

      asaasCustomerId = customer.id;
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { asaasCustomerId },
      });
      console.log("✅ Cliente Asaas criado e salvo:", asaasCustomerId);
    } else {
      console.log("♻️ Reutilizando cliente Asaas existente:", asaasCustomerId);
    }

    // ── 2. Cancela assinatura anterior se existir ─────────────────────────
    // Evita conflito quando o usuário tenta assinar novamente
    if (user.shop.asaasSubscriptionId) {
      console.log("🔄 Cancelando assinatura anterior:", user.shop.asaasSubscriptionId);
      try {
        await fetch(`${ASAAS_API}/subscriptions/${user.shop.asaasSubscriptionId}`, {
          method: "DELETE",
          headers: { "access_token": ASAAS_KEY },
        });
      } catch (e) {
        // Não bloqueia o fluxo se falhar ao cancelar
        console.warn("⚠️ Não foi possível cancelar assinatura anterior:", e);
      }
    }

    // ── 3. Cria nova assinatura ───────────────────────────────────────────
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const nextDueDate = amanha.toISOString().split("T")[0];
    const billingType = metodo === "pix" ? "PIX" : "CREDIT_CARD";

    console.log("📝 Criando assinatura:", {
      customer: asaasCustomerId,
      billingType,
      value: plano.valor,
      nextDueDate,
      cycle: plano.ciclo,
    });

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

    if (!assinaturaRes.ok) {
      console.error("❌ Falha ao criar assinatura no Asaas:", assinaturaText);
      return NextResponse.json(
        { error: "Erro ao criar assinatura no Asaas" },
        { status: 500 }
      );
    }

    const subscription = JSON.parse(assinaturaText);

    if (!subscription.id) {
      console.error("❌ Asaas não retornou ID de assinatura:", subscription);
      return NextResponse.json(
        { error: "Erro ao criar assinatura" },
        { status: 500 }
      );
    }

    // ── 4. Salva assinatura no banco ──────────────────────────────────────
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: {
        asaasSubscriptionId: subscription.id,
        planType: tipo,
      },
    });
    console.log("✅ Assinatura salva:", subscription.id);

    // ── 5. Busca a primeira cobrança ──────────────────────────────────────
    // Aguarda um instante para o Asaas gerar a cobrança (eventual consistency)
    await new Promise((r) => setTimeout(r, 1000));

    const cobrancaRes = await fetch(
      `${ASAAS_API}/subscriptions/${subscription.id}/payments`,
      { headers: { "access_token": ASAAS_KEY } }
    );

    const cobrancaText = await cobrancaRes.text();
    console.log("ASAAS COBRANÇA status:", cobrancaRes.status);
    console.log("ASAAS COBRANÇA body:", cobrancaText);

    if (!cobrancaRes.ok) {
      console.error("❌ Falha ao buscar cobranças:", cobrancaText);
      return NextResponse.json(
        { error: "Erro ao buscar cobrança" },
        { status: 500 }
      );
    }

    const cobrancas = JSON.parse(cobrancaText);
    const primeiraCobranca = cobrancas.data?.[0];

    if (!primeiraCobranca?.id) {
      console.error("❌ Nenhuma cobrança encontrada para a assinatura:", subscription.id);
      console.error("Resposta completa:", cobrancas);
      return NextResponse.json(
        { error: "Não foi possível gerar cobrança" },
        { status: 500 }
      );
    }

    console.log("✅ Primeira cobrança:", primeiraCobranca.id, "status:", primeiraCobranca.status);

    // ── 6. PIX: retorna QR Code ───────────────────────────────────────────
    if (metodo === "pix") {
      const pixRes = await fetch(
        `${ASAAS_API}/payments/${primeiraCobranca.id}/pixQrCode`,
        { headers: { "access_token": ASAAS_KEY } }
      );

      const pixText = await pixRes.text();
      console.log("ASAAS PIX status:", pixRes.status);
      console.log("ASAAS PIX body:", pixText);

      if (!pixRes.ok) {
        console.error("❌ Falha ao gerar QR Code PIX:", pixText);
        return NextResponse.json(
          { error: "Erro ao gerar QR Code PIX" },
          { status: 500 }
        );
      }

      const pixData = JSON.parse(pixText);

      if (!pixData.payload) {
        console.error("❌ PIX sem payload:", pixData);
        return NextResponse.json(
          { error: "Erro ao gerar QR Code PIX" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        metodo: "pix",
        paymentId: primeiraCobranca.id,
        qrCode: pixData.encodedImage,
        copiaCola: pixData.payload,
        valor: plano.valor,
      });
    }

    // ── 7. Cartão: retorna link de pagamento ──────────────────────────────
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
      console.error("❌ invoiceUrl ausente na cobrança:", primeiraCobranca);
      return NextResponse.json(
        { error: "Erro ao gerar link de pagamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      metodo: "cartao",
      url: linkPagamento,
    });

  } catch (error: any) {
    console.error("🔥 ERRO INESPERADO NO CHECKOUT:", error?.message ?? error);
    console.error("Stack:", error?.stack);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}