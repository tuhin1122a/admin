import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalDeposits =
      (
        await db.deposit.aggregate({
          where: {
            userId: user.id,
            status: "APPROVED",
          },
          _sum: {
            amount: true,
          },
        })
      )._sum.amount || 0;

    const totalWithdraws =
      (
        await db.withdraw.aggregate({
          where: {
            userId: user.id,
            status: "APPROVED",
          },
          _sum: {
            amount: true,
          },
        })
      )._sum.amount || 0;

    const lastDeposits =
      (
        await db.deposit.findFirst({
          where: { userId: user.id, status: "APPROVED" },
          select: { amount: true },
          orderBy: { createdAt: "desc" },
        })
      )?.amount || 0;

    const lastWithdraws =
      (
        await db.withdraw.findFirst({
          where: { userId: user.id, status: "APPROVED" },
          select: { amount: true },
          orderBy: { createdAt: "desc" },
        })
      )?.amount || 0;

    const [deposits, withdraws] = await Promise.all([
      db.deposit.findMany({
        orderBy: { createdAt: "desc" },
        take: 10, // or a larger number
      }),
      db.withdraw.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);
    const taggedDeposits = deposits.map((d) => ({ ...d, type: "deposit" }));
    const taggedWithdraws = withdraws.map((w) => ({ ...w, type: "withdraw" }));
    const allTransactions = [...taggedDeposits, ...taggedWithdraws].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestTransactions = allTransactions.slice(0, 10);

    return NextResponse.json({
      success: true,
      user,
      financialOverview: {
        totalDeposits,
        totalWithdraws,
        lastDeposits,
        lastWithdraws,
      },
      bettingStatistics: {
        totalBet: 0,
        totalWin: 0,
        totalLosss: 0,
        winRate: 0,
      },
      latestTransactions,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
