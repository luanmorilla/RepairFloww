import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // ── Pagamento confirmado ──
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const shopId = session.metadata?.shopId;
      if (!shopId) break;

      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

      const priceId = subscription.items.data[0]?.price.id;
      const planType =
        priceId === process.env.STRIPE_PRICE_TRIMESTRAL ? "trimestral" : "mensal";

      const expiresAt = new Date(subscription.current_period_end * 1000);

      await prisma.shop.update({
        where: { id: shopId },
        data: {
          planStatus: "active",
          planType,
          planExpiresAt: expiresAt,
          stripeSubscriptionId: subscriptionId,
        },
      });
      break;
    }

    // ── Assinatura renovada ──
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;

      const shop = await prisma.shop.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (!shop) break;

      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          planStatus: "active",
          planExpiresAt: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }

    // ── Pagamento falhou / cancelou ──
    case "invoice.payment_failed":
    case "customer.subscription.deleted": {
      const obj = event.data.object as any;
      const customerId = obj.customer as string;

      const shop = await prisma.shop.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (!shop) break;

      await prisma.shop.update({
        where: { id: shop.id },
        data: { planStatus: "expired" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}