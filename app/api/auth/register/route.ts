import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(3, "O nome precisa de pelo menos 3 caracteres"),
  shopName: z.string().min(3, "O nome da assistência precisa de pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa de pelo menos 6 caracteres"),
  cpfCnpj: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { name, shopName, email, password, cpfCnpj } = result.data;

    const userExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado em nossa plataforma." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const resultTransaction = await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          standardWarranty: 90,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          cpfCnpj: cpfCnpj.replace(/\D/g, ""), // salva só os números
          role: "ADMIN",
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