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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user) {
          throw new Error("E-mail não encontrado em nosso sistema.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Senha incorreta. Tente novamente.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          shopId: user.shopId,  // ✅ já estava aqui
        };
      }
    })
  ],

  // ✅ ISSO QUE FALTAVA — salva shopId no token e expõe na sessão
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.shopId = (user as any).shopId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).shopId = token.shopId;
        (session.user as any).id = token.id;
      }
      return session;
    }
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