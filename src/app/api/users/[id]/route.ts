import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { getRecentCallbackLogs, toNumericUserId } from "@/lib/softapi";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: { wallet: true, bettingRecord: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned && user.wallet) {
      (user.wallet as any).balance = 0;
    }

    // Deposits and Withdraws for this user
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
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.withdraw.findMany({
        where: { userId: user.id },
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

    const approvedDepositsCount = await db.deposit.count({
      where: {
        userId: user.id,
        status: "APPROVED",
      },
    });

    // Real Betting Statistics from database
    const totalBet = Number(user.bettingRecord?.totalBet ?? 0);
    const totalWin = Number(user.bettingRecord?.totalWin ?? 0);
    const totalLoss = Math.max(0, totalBet - totalWin);
    const winRate =
      totalBet > 0 ? Number(((totalWin / totalBet) * 100).toFixed(2)) : 0;

    // Filter SoftAPI recent callback logs for this specific user
    const numericUserId = toNumericUserId(user.playerId || user.id);
    const allLogs = getRecentCallbackLogs();
    const userLogs = allLogs.filter((l) => {
      const acc = String(l.member_account).trim();
      return (
        acc === user.playerId ||
        acc === user.id ||
        acc === user.phone ||
        acc === String(numericUserId)
      );
    });

    const betHistory = userLogs.map((l) => {
      const bAmt = Number(l.bet_amount ?? 0);
      const wAmt = Number(l.win_amount ?? 0);
      const mult = bAmt > 0 ? Number((wAmt / bAmt).toFixed(2)) : 0;
      let status: "WIN" | "LOSS" | "REFUND" = "LOSS";
      if (wAmt > bAmt) status = "WIN";
      else if (wAmt === bAmt && bAmt > 0) status = "REFUND";

      return {
        serialNumber: l.serial_number,
        gameUid: l.game_uid,
        gameName: l.game_name || `Game #${l.game_uid}`,
        gameRound: l.game_round,
        betAmount: bAmt,
        winAmount: wAmt,
        multiplier: mult,
        creditAmount: Number(l.credit_amount ?? 0),
        status,
        freeSpinBonus: l.free_spin_bonus,
        createdAt: l.receivedAt || l.timestamp,
      };
    });

    return NextResponse.json({
      success: true,
      user,
      financialOverview: {
        totalDeposits: Number(totalDeposits),
        totalWithdraws: Number(totalWithdraws),
        lastDeposits: Number(lastDeposits),
        lastWithdraws: Number(lastWithdraws),
        approvedDepositsCount,
      },
      bettingStatistics: {
        totalBet,
        totalWin,
        totalLosss: totalLoss,
        winRate,
      },
      latestTransactions,
      betHistory,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const { signinBonus } = await req.json();

    if (typeof signinBonus !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const updatedWallet = await db.wallet.update({
      where: { userId: id },
      data: { signinBonus },
    });

    return NextResponse.json({ success: true, wallet: updatedWallet });
  } catch (error) {
    console.error("Failed to update wallet signinBonus:", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
