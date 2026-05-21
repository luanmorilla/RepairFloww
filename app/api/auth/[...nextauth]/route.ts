import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Preencha todos os campos.");
        }

        // 1. Busca o usuário
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        // ERRO EXATO 1: E-mail não existe
        if (!user) {
          throw new Error("E-mail não encontrado em nosso sistema.");
        }

        // 2. Valida a senha
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        // ERRO EXATO 2: Senha errada
        if (!isPasswordValid) {
          throw new Error("Senha incorreta. Tente novamente.");
        }

        // 3. Sucesso total
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          shopId: user.shopId,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };