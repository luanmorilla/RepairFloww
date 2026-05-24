import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/painel")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Não autenticado → login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── /painel/ativado é especial: só precisa de autenticação, não de plano ativo
  // É aqui que o token é atualizado após o pagamento
  if (pathname === "/painel/ativado") {
    return NextResponse.next();
  }

  const shopId = (token as any).shopId;
  if (!shopId) {
    return NextResponse.redirect(new URL("/planos", request.url));
  }

  const planStatus = (token as any).planStatus;
  if (planStatus !== "active") {
    return NextResponse.redirect(new URL("/planos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*"],
};