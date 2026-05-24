// app/api/plan/ativar/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  console.log("🟡 [ativar] sessionId:", sessionId);
  console.log("🟡 [ativar] NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

  const planos = `${process.env.NEXTAUTH_URL}/planos`;
  const painel = `${process.env.NEXTAUTH_URL}/painel?plano=ativado`;

  if (!sessionId) {
    console.log("🔴 [ativar] sem sessionId, redirecionando para /planos");
    return NextResponse.redirect(planos);
  }

  try {
    console.log("🟡 [ativar] buscando sessão no Stripe...");
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    console.log("🟡 [ativar] payment_status:", session.payment_status);
    console.log("🟡 [ativar] metadata:", session.metadata);

    if (session.payment_status !== "paid") {
      console.log("🔴 [ativar] pagamento não confirmado");
      return NextResponse.redirect(planos);
    }

    const shopId = session.metadata?.shopId;
    if (!shopId) {
      console.log("🔴 [ativar] shopId ausente no metadata");
      return NextResponse.redirect(planos);
    }

    const subscription = session.subscription as any;
    console.log("🟡 [ativar] subscription.id:", subscription?.id);
    console.log("🟡 [ativar] subscription.status:", subscription?.status);

    const priceId = subscription?.items?.data[0]?.price?.id;
    const planType =
      priceId === process.env.STRIPE_PRICE_TRIMESTRAL ? "trimestral" : "mensal";
    const expiresAt = new Date((subscription?.current_period_end ?? 0) * 1000);

    console.log("🟡 [ativar] atualizando shopId:", shopId, "planType:", planType);

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        planStatus: "active",
        planType,
        planExpiresAt: expiresAt,
        stripeSubscriptionId: subscription?.id,
      },
    });

    console.log("🟢 [ativar] plano ativado! Redirecionando para /painel");
    return NextResponse.redirect(painel);
  } catch (err) {
    console.error("🔴 [ativar] ERRO DETALHADO:", err);
    return NextResponse.redirect(planos);
  }
}