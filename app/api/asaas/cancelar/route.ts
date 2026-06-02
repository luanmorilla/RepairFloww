import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const ASAAS_API = "https://api.asaas.com/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY!;

export async function POST() {
  try {
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

    const { asaasSubscriptionId } = user.shop;

    if (!asaasSubscriptionId) {
      return NextResponse.json({ error: "Nenhuma assinatura ativa encontrada." }, { status: 404 });
    }

    // Cancela a assinatura no Asaas
    const res = await fetch(`${ASAAS_API}/subscriptions/${asaasSubscriptionId}`, {
      method: "DELETE",
      headers: { "access_token": ASAAS_KEY },
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Erro Asaas (cancelar):", err);
      return NextResponse.json({ error: "Erro ao cancelar no Asaas." }, { status: 500 });
    }

    // Atualiza o status local
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: {
        planStatus: "canceled",
        asaasSubscriptionId: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERRO CANCELAR ASAAS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}