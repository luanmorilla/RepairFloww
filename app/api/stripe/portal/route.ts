import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST() {
  try {
    const session = await getServerSession();

    // usuário precisa estar logado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // busca usuário + loja
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        shop: true,
      },
    });

    // precisa existir customer da stripe
    if (!user?.shop?.stripeCustomerId) {
      return NextResponse.json(
        {
          error: "Nenhuma assinatura ativa encontrada.",
        },
        { status: 404 }
      );
    }

    // cria sessão do portal stripe
    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer: user.shop.stripeCustomerId,

        return_url: `${process.env.NEXTAUTH_URL}/painel/configuracoes`,
      });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Erro portal stripe:", error);

    return NextResponse.json(
      {
        error: "Erro ao abrir portal de assinatura",
      },
      { status: 500 }
    );
  }
}