import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Só protege rotas do painel
  if (!pathname.startsWith("/painel")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Não autenticado → login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Busca status do plano via API interna
  const shopId = (token as any).shopId;
  if (!shopId) {
    return NextResponse.redirect(new URL("/planos", request.url));
  }

  // Checa plano no banco
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/plan/status?shopId=${shopId}`);
  const data = await res.json();

  if (data.planStatus !== "active") {
    return NextResponse.redirect(new URL("/planos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*"],
};