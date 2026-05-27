import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    });

    if (!user?.shop) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    let customerId = user.shop.stripeCustomerId;
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.shop.name,
        metadata: { shopId: user.shop.id },
      });
      customerId = customer.id;
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/painel`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Erro portal stripe:", error);
    return NextResponse.json({ error: "Erro ao abrir portal de assinatura" }, { status: 500 });
  }
}