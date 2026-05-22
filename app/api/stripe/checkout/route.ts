import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json();
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

    // Cria ou reutiliza customer no Stripe
    let customerId = user.shop.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user.shop.name,
        metadata: { shopId: user.shop.id },
      });
      customerId = customer.id;
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/painel?plano=sucesso`,
      cancel_url: `${process.env.NEXTAUTH_URL}/planos`,
      metadata: { shopId: user.shop.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("ERRO CHECKOUT:", error);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }
}