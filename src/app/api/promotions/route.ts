import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const promotions = await db.promotion.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    // Fetch target user details for specific promotions
    const targetUserIds = Array.from(
      new Set(promotions.flatMap((p: any) => p.targetUserIds || []))
    );

    let userMap: Record<string, { id: string; phone: string; playerId: string; name: string }> = {};
    if (targetUserIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: targetUserIds } },
        select: { id: true, phone: true, playerId: true, name: true },
      });
      userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));
    }

    const enrichedPromotions = promotions.map((p: any) => ({
      ...p,
      targetUsers: (p.targetUserIds || []).map((uid: string) => userMap[uid] || { id: uid, phone: "Unknown", playerId: uid }),
    }));

    return NextResponse.json({ promotions: enrichedPromotions });
  } catch (error: any) {
    console.error("Error fetching promotions in admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      context = "Special Bonus",
      category = "all",
      badge,
      badgeColor = "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
      turnover = "1x Turnover",
      minDeposit = "500 BDT",
      description = "",
      content = "",
      image = "/promotion/promotion-1.jpg",
      targetType = "ALL", // "ALL" or "SPECIFIC"
      targetUserIds = [],
      isActive = true,
      sortOrder = 0,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const promotion = await db.promotion.create({
      data: {
        title,
        context,
        category,
        badge,
        badgeColor,
        turnover,
        minDeposit,
        description,
        content,
        image,
        targetType,
        targetUserIds: Array.isArray(targetUserIds) ? targetUserIds : [],
        isActive: Boolean(isActive),
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    console.error("Error creating promotion in admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
