import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    const record = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: record.email },
      data: { password: hashed }
    });

    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO RESET:", error);
    return NextResponse.json({ error: "Erro ao redefinir senha." }, { status: 500 });
  }
}