// app/api/auth/plan-status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ planStatus: null });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { shop: { select: { planStatus: true } } },
  });

  return NextResponse.json({ planStatus: user?.shop?.planStatus ?? null });
}