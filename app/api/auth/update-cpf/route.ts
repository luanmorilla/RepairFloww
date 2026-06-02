import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { cpfCnpj } = await request.json();

    // Limpa e valida o CPF
    const cpfLimpo = cpfCnpj.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // Salva o CPF no usuário logado
    await prisma.user.update({
      where: { email: session.user.email },
      data: { cpfCnpj: cpfLimpo },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO AO SALVAR CPF:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}