// app/api/plan/ativar/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../lib/prisma"; // import relativo evita problema de path

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  const planos = `${process.env.NEXTAUTH_URL}/planos`;
  const painel = `${process.env.NEXTAUTH_URL}/painel?plano=ativado`;

  if (!sessionId) return NextResponse.redirect(planos);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid") return NextResponse.redirect(planos);

    const shopId = session.metadata?.shopId;
    if (!shopId) return NextResponse.redirect(planos);

    // cast para any resolve o problema de tipagem do Stripe SDK v14+
    const subscription = session.subscription as any;
    const priceId = subscription?.items?.data[0]?.price?.id;
    const planType =
      priceId === process.env.STRIPE_PRICE_TRIMESTRAL ? "trimestral" : "mensal";
    const expiresAt = new Date((subscription?.current_period_end ?? 0) * 1000);

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        planStatus: "active",
        planType,
        planExpiresAt: expiresAt,
        stripeSubscriptionId: subscription?.id,
      },
    });

    return NextResponse.redirect(painel);
  } catch (err) {
    console.error("Erro ao ativar plano:", err);
    return NextResponse.redirect(planos);
  }
}