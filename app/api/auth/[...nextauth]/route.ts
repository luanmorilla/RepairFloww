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
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Preencha todos os campos.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) throw new Error("E-mail não encontrado em nosso sistema.");

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) throw new Error("Senha incorreta. Tente novamente.");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          shopId: user.shopId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // No login, salva shopId e id
      if (user) {
        token.shopId = (user as any).shopId;
        token.id = user.id;
      }

      // Sempre busca planStatus do banco a cada vez que o token é gerado/renovado
      // Isso garante que após o pagamento o token reflete o status atual
      if (token.shopId) {
        const shop = await prisma.shop.findUnique({
          where: { id: token.shopId as string },
          select: { planStatus: true, planType: true, planExpiresAt: true },
        });
        if (shop) {
          token.planStatus = shop.planStatus;
          token.planType = shop.planType;
          token.planExpiresAt = shop.planExpiresAt?.toISOString() ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).shopId = token.shopId;
        (session.user as any).planStatus = token.planStatus;
        (session.user as any).planType = token.planType;
        (session.user as any).planExpiresAt = token.planExpiresAt;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };