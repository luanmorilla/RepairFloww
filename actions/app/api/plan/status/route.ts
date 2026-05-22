import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ planStatus: "inactive" });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { planStatus: true, planExpiresAt: true },
  });

  if (!shop) {
    return NextResponse.json({ planStatus: "inactive" });
  }

  // Verifica se expirou
  if (shop.planExpiresAt && new Date() > shop.planExpiresAt) {
    await prisma.shop.update({
      where: { id: shopId },
      data: { planStatus: "expired" },
    });
    return NextResponse.json({ planStatus: "expired" });
  }

  return NextResponse.json({ planStatus: shop.planStatus });
}