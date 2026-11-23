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
    const netGamingResult = totalWin - totalBet;

    // Full Bonus Tracking: Daily Bonus, Referral Bonus, Spin Bonus
    const [claimedSignin, claimedInvites, spinAgg] = await Promise.all([
      db.claimedSigninReward
        .findMany({
          where: { userId: user.id },
          include: { reward: true },
        })
        .catch(() => []),
      db.claimedInvitationReward
        .findMany({
          where: { invitationBonus: { userId: user.id } },
          include: { reward: true },
        })
        .catch(() => []),
      db.luckyWheelSpin
        .aggregate({
          where: { userId: user.id },
          _sum: { prizeValue: true },
          _count: { id: true },
        })
        .catch(() => ({ _sum: { prizeValue: 0 }, _count: { id: 0 } })),
    ]);

    const totalDailyBonus = claimedSignin.reduce(
      (sum, r: any) => sum + Number(r.reward?.prize ?? 0),
      0
    );
    const totalReferralBonus = claimedInvites.reduce(
      (sum, r: any) => sum + Number(r.reward?.prize ?? 0),
      0
    );
    const totalSpinBonus = Number(spinAgg._sum?.prizeValue ?? 0);
    const totalBonuses =
      totalDailyBonus + totalReferralBonus + totalSpinBonus;

    const currentWalletBalance = user.isBanned
      ? 0
      : Number(user.wallet?.balance ?? 0);

    const bonusBreakdown = {
      dailyBonus: totalDailyBonus,
      dailyBonusCount: claimedSignin.length,
      referralBonus: totalReferralBonus,
      referralBonusCount: claimedInvites.length,
      spinBonus: totalSpinBonus,
      spinBonusCount: spinAgg._count?.id ?? 0,
      totalBonuses,
    };

    const balanceAudit = {
      currentBalance: currentWalletBalance,
      totalDeposits: Number(totalDeposits),
      totalWithdraws: Number(totalWithdraws),
      totalBonuses,
      totalBet,
      totalWin,
      totalLoss,
      netGamingResult,
      estimatedInflow: Number(totalDeposits) + totalBonuses + totalWin,
      estimatedOutflow: Number(totalWithdraws) + totalBet,
    };

    // Load database BetHistory for this user (plus fallback to any local file logs not yet in DB)
    const dbBets = await db.betHistory
      .findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []);

    const seenSerials = new Set<string>();
    const betHistory: Array<Record<string, unknown>> = [];

    for (const row of dbBets) {
      seenSerials.add(row.serialNumber);
      const bAmt = Number(row.betAmount ?? 0);
      const wAmt = Number(row.winAmount ?? 0);
      const mult = bAmt > 0 ? Number((wAmt / bAmt).toFixed(2)) : 0;
      const status: "WIN" | "LOSS" | "REFUND" =
        row.status === "WIN" || row.status === "REFUND"
          ? (row.status as "WIN" | "REFUND")
          : wAmt > bAmt
          ? "WIN"
          : wAmt === bAmt && bAmt > 0
          ? "REFUND"
          : "LOSS";

      betHistory.push({
        serialNumber: row.serialNumber,
        gameUid: row.gameUid,
        gameName: row.gameName || `Game #${row.gameUid}`,
        gameRound: row.gameRound || "",
        betAmount: bAmt,
        winAmount: wAmt,
        multiplier: mult,
        creditAmount: Number(row.creditAmount ?? 0),
        status,
        freeSpinBonus: row.freeSpinBonus || undefined,
        createdAt: row.createdAt,
      });
    }

    const numericUserId = toNumericUserId(user.playerId || user.id);
    const allLogs = getRecentCallbackLogs();
    const userLogs = allLogs.filter((l) => {
      if (seenSerials.has(l.serial_number)) return false;
      const acc = String(l.member_account).trim();
      return (
        acc === user.playerId ||
        acc === user.id ||
        acc === user.phone ||
        acc === String(numericUserId)
      );
    });

    for (const l of userLogs) {
      const bAmt = Number(l.bet_amount ?? 0);
      const wAmt = Number(l.win_amount ?? 0);
      const mult = bAmt > 0 ? Number((wAmt / bAmt).toFixed(2)) : 0;
      let status: "WIN" | "LOSS" | "REFUND" = "LOSS";
      if (wAmt > bAmt) status = "WIN";
      else if (wAmt === bAmt && bAmt > 0) status = "REFUND";

      betHistory.push({
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
      });
    }

    // Fetch recent GameSessions (Entry vs Exit Balance tracking)
    const rawSessions = await db.gameSession.findMany({
      where: { userId: id },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    const gameSessions = rawSessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      gameUid: s.gameUid,
      gameName: s.gameName,
      provider: s.provider,
      startBalance: Number(s.startBalance),
      endBalance: s.endBalance !== null ? Number(s.endBalance) : null,
      netProfit: s.netProfit !== null ? Number(s.netProfit) : null,
      totalBet: Number(s.totalBet),
      totalWin: Number(s.totalWin),
      roundsCount: s.roundsCount,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    }));

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
      bonusBreakdown,
      balanceAudit,
      gameSessions,
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
