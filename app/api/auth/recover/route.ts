import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: "E-mail não encontrado." }, { status: 404 });
    }

    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true }
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, email: email.toLowerCase(), expiresAt }
    });

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://repair-floww.vercel.app";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "RepairFlow <onboarding@resend.dev>",
      to: email,
      subject: "Recuperação de Senha - RepairFlow",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="color: #18181b;">Recuperação de Senha</h2>
          <p style="color: #52525b; font-size: 16px;">Olá, <strong>${user.name}</strong>!</p>
          <p style="color: #52525b; font-size: 16px;">Clique no botão abaixo para redefinir sua senha. O link expira em <strong>1 hora</strong>.</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetLink}" style="background-color: #18181b; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #a1a1aa; font-size: 12px; text-align: center;">Se você não pediu isso, ignore este e-mail. O link expira automaticamente.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO RECOVER:", error);
    return NextResponse.json({ error: "Erro ao enviar e-mail." }, { status: 500 });
  }
}