import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // 1. Verifica se o e-mail realmente existe no nosso banco Neon
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: "E-mail não encontrado em nosso sistema." }, { status: 404 });
    }

    // 2. Cria um link (por enquanto direto, depois colocaremos segurança avançada)
    const resetLink = `http://localhost:3000/login`;

    // 3. Envia o e-mail de verdade usando o Resend!
    await resend.emails.send({
      from: "RepairFlow <onboarding@resend.dev>",
      to: email, // ATENÇÃO: No plano grátis, isso SÓ envia para o e-mail da sua própria conta do Resend
      subject: "Recuperação de Senha - RepairFlow",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="color: #18181b; margin-bottom: 20px;">Recuperação de Senha</h2>
          <p style="color: #52525b; line-height: 1.6; font-size: 16px;">Olá, <strong>${user.name}</strong>!</p>
          <p style="color: #52525b; line-height: 1.6; font-size: 16px;">Recebemos um pedido para redefinir a senha da sua conta no RepairFlow.</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetLink}" style="background-color: #18181b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Acessar Plataforma
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; text-align: center;">Se você não pediu isso, apenas ignore este e-mail.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO RESEND:", error);
    return NextResponse.json({ error: "Erro ao tentar enviar o e-mail." }, { status: 500 });
  }
}
