import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { INTERNAL_SERVER_ERROR } from "@/error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const adminId = session.user.id;
    const isSubAdmin = role === "SUBADMIN";

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "ALL").toUpperCase();
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "30", 10))
    );
    const skip = (page - 1) * limit;

    const baseScope: Record<string, any> = {};
    if (isSubAdmin && adminId) {
      baseScope.user = { subAdminId: adminId };
    }

    const filterWhere: Record<string, any> = {
      ...baseScope,
    };

    if (status === "WIN" || status === "LOSS" || status === "REFUND") {
      filterWhere.status = status;
    }

    if (q) {
      filterWhere.OR = [
        { gameName: { contains: q, mode: "insensitive" } },
        { gameUid: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { gameRound: { contains: q, mode: "insensitive" } },
        { memberAccount: { contains: q, mode: "insensitive" } },
        {
          user: {
            OR: [
              { phone: { contains: q, mode: "insensitive" } },
              { playerId: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [rows, totalFiltered, aggregateAll, winCount, lossCount] =
      await Promise.all([
        db.betHistory.findMany({
          where: filterWhere,
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                playerId: true,
                name: true,
                subAdminId: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.betHistory.count({ where: filterWhere }),
        db.betHistory.aggregate({
          where: baseScope,
          _sum: {
            betAmount: true,
            winAmount: true,
          },
          _count: {
            id: true,
          },
        }),
        db.betHistory.count({
          where: { ...baseScope, status: "WIN" },
        }),
        db.betHistory.count({
          where: { ...baseScope, status: "LOSS" },
        }),
      ]);

    const totalBet = Number(aggregateAll._sum.betAmount ?? 0);
    const totalWin = Number(aggregateAll._sum.winAmount ?? 0);
    const casinoNetProfit = Number((totalBet - totalWin).toFixed(2));
    const totalRounds = Number(aggregateAll._count.id ?? 0);

    const bets = rows.map((r) => {
      const bAmt = Number(r.betAmount);
      const wAmt = Number(r.winAmount);
      const mult = bAmt > 0 ? Number((wAmt / bAmt).toFixed(2)) : 0;
      return {
        id: r.id,
        serialNumber: r.serialNumber,
        userId: r.userId,
        userPhone: r.user?.phone || r.memberAccount,
        playerId: r.user?.playerId || r.memberAccount,
        userName: r.user?.name || "Player",
        gameUid: r.gameUid,
        gameName: r.gameName,
        provider: r.provider,
        brandId: r.brandId,
        category: r.category,
        gameRound: r.gameRound,
        betAmount: bAmt,
        winAmount: wAmt,
        multiplier: mult,
        creditAmount: Number(r.creditAmount),
        status: r.status,
        freeSpinBonus: r.freeSpinBonus,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalBet,
        totalWin,
        casinoNetProfit,
        totalRounds,
        winCount,
        lossCount,
      },
      bets,
      total: totalFiltered,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/bet-history error:", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
