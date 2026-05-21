import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// CORREÇÃO: Usamos apenas z.object() ao invés de z.zod.object()
const registerSchema = z.object({
  name: z.string().min(3, "O nome precisa de pelo menos 3 caracteres"),
  shopName: z.string().min(3, "O nome da assistência precisa de pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa de pelo menos 6 caracteres"),
});

export async function POST(request: Request) {
  try {
    // 1. Pega os dados enviados pelo formulário da tela
    const body = await request.json();
    
    // 2. Valida os dados com o molde do Zod
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { name, shopName, email, password } = result.data;

    // 3. Verifica se o e-mail já existe no banco de dados
    const userExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado em nossa plataforma." },
        { status: 409 }
      );
    }

    // 4. Criptografa a senha com segurança máxima
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Salva no Neon usando uma Transação (Garante que ou cria os DOIS ou não cria nada)
    const resultTransaction = await prisma.$transaction(async (tx) => {
      // Cria a Assistência Técnica
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          standardWarranty: 90, // Dias de garantia padrão de fábrica
        },
      });

      // Cria o Usuário Administrador vinculado a essa Assistência
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "ADMIN", // Primeiro usuário sempre é o Dono/Admin
          shopId: shop.id,
        },
      });

      return { shop, user };
    });

    return NextResponse.json(
      { message: "Conta criada com sucesso!", shopId: resultTransaction.shop.id },
      { status: 201 }
    );

  } catch (error) {
    console.error("ERRO_NO_CADASTRO:", error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
