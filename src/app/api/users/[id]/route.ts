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
      (user.wallet as any).balance = 0 as any;
    }

    // 1. Deposits and Withdraws aggregates (safely guarded)
    const depositAgg = await db.deposit
      .aggregate({
        where: {
          userId: user.id,
          status: "APPROVED",
        },
        _sum: {
          amount: true,
        },
      })
      .catch((err) => {
        console.error("Deposit aggregate error:", err?.message);
        return { _sum: { amount: null } };
      });
    const totalDeposits = Number(depositAgg._sum.amount ?? 0);

    const withdrawAgg = await db.withdraw
      .aggregate({
        where: {
          userId: user.id,
          status: "APPROVED",
        },
        _sum: {
          amount: true,
        },
      })
      .catch((err) => {
        console.error("Withdraw aggregate error:", err?.message);
        return { _sum: { amount: null } };
      });
    const totalWithdraws = Number(withdrawAgg._sum.amount ?? 0);

    // 2. Last deposit & withdraw
    const lastDepositRow = await db.deposit
      .findFirst({
        where: { userId: user.id, status: "APPROVED" },
        select: { amount: true },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null);
    const lastDeposits = Number(lastDepositRow?.amount ?? 0);

    const lastWithdrawRow = await db.withdraw
      .findFirst({
        where: { userId: user.id, status: "APPROVED" },
        select: { amount: true },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null);
    const lastWithdraws = Number(lastWithdrawRow?.amount ?? 0);

    // 3. Recent 10 deposits and withdraws
    const [deposits, withdraws] = await Promise.all([
      db.deposit
        .findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        .catch(() => []),
      db.withdraw
        .findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        .catch(() => []),
    ]);

    const taggedDeposits = (deposits || []).map((d) => ({
      ...d,
      amount: Number(d.amount ?? 0),
      type: "deposit",
    }));
    const taggedWithdraws = (withdraws || []).map((w) => ({
      ...w,
      amount: Number(w.amount ?? 0),
      type: "withdraw",
    }));
    const allTransactions = [...taggedDeposits, ...taggedWithdraws].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestTransactions = allTransactions.slice(0, 10);

    const approvedDepositsCount = await db.deposit
      .count({
        where: {
          userId: user.id,
          status: "APPROVED",
        },
      })
      .catch(() => 0);

    // 4. Real Betting Statistics from database
    const totalBet = Number(user.bettingRecord?.totalBet ?? 0);
    const totalWin = Number(user.bettingRecord?.totalWin ?? 0);
    const totalLoss = Math.max(0, totalBet - totalWin);
    const winRate =
      totalBet > 0 ? Number(((totalWin / totalBet) * 100).toFixed(2)) : 0;
    const netGamingResult = totalWin - totalBet;

    // 5. Full Bonus Tracking: Daily Bonus, Referral Bonus, Spin Bonus
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

    const totalDailyBonus = (claimedSignin || []).reduce(
      (sum: number, r: any) => sum + Number(r.reward?.prize ?? 0),
      0
    );
    const totalReferralBonus = (claimedInvites || []).reduce(
      (sum: number, r: any) => sum + Number(r.reward?.prize ?? 0),
      0
    );
    const totalSpinBonus = Number((spinAgg as any)?._sum?.prizeValue ?? 0);
    const totalBonuses =
      totalDailyBonus + totalReferralBonus + totalSpinBonus;

    const currentWalletBalance = user.isBanned
      ? 0
      : Number(user.wallet?.balance ?? 0);

    const bonusBreakdown = {
      dailyBonus: totalDailyBonus,
      dailyBonusCount: (claimedSignin || []).length,
      referralBonus: totalReferralBonus,
      referralBonusCount: (claimedInvites || []).length,
      spinBonus: totalSpinBonus,
      spinBonusCount: (spinAgg as any)?._count?.id ?? 0,
      totalBonuses,
    };

    const balanceAudit = {
      currentBalance: currentWalletBalance,
      totalDeposits,
      totalWithdraws,
      totalBonuses,
      totalBet,
      totalWin,
      totalLoss,
      netGamingResult,
      estimatedInflow: totalDeposits + totalBonuses + totalWin,
      estimatedOutflow: totalWithdraws + totalBet,
    };

    // 6. Load database BetHistory for this user
    const dbBets = await db.betHistory
      .findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []);

    const seenSerials = new Set<string>();
    const betHistory: Array<Record<string, unknown>> = [];

    for (const row of dbBets || []) {
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

    // 7. SoftAPI recent callback logs (safely wrapped)
    let allLogs: any[] = [];
    try {
      allLogs = getRecentCallbackLogs();
    } catch {
      allLogs = [];
    }

    const numericUserId = toNumericUserId(user.playerId || user.id);
    const userLogs = (allLogs || []).filter((l) => {
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

    // 8. Fetch GameSessions (Safely guarded against missing table on VPS!) + Live Active Session / Device / Location
    const [activeSessRow, regDeviceRow] = await Promise.all([
      db.siteConfig
        .findUnique({ where: { key: `active_session:${user.id}` } })
        .catch(() => null),
      db.siteConfig
        .findUnique({ where: { key: `USER_REG_DEVICE_${user.id}` } })
        .catch(() => null),
    ]);

    let activeSessData: any = null;
    let regDeviceData: any = null;
    try {
      if (activeSessRow?.value) activeSessData = JSON.parse(activeSessRow.value);
    } catch {}
    try {
      if (regDeviceRow?.value) regDeviceData = JSON.parse(regDeviceRow.value);
    } catch {}

    const rawIp = String(activeSessData?.ip || regDeviceData?.ip || "").replace(
      /^::ffff:/,
      ""
    );
    let resolvedLocation = activeSessData?.location || undefined;
    let resolvedIsp = activeSessData?.isp || undefined;

    if (
      rawIp &&
      !resolvedLocation &&
      rawIp !== "unknown" &&
      rawIp !== "127.0.0.1" &&
      !rawIp.startsWith("192.168.") &&
      !rawIp.startsWith("10.")
    ) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1800);
        const geoRes = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(rawIp)}?fields=status,country,regionName,city,isp`,
          { signal: controller.signal }
        );
        clearTimeout(timer);
        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          if (geoJson?.status === "success") {
            const city = geoJson.city || geoJson.regionName || "";
            const country = geoJson.country || "";
            resolvedLocation =
              [city, country].filter(Boolean).join(", ") || country || undefined;
            resolvedIsp = geoJson.isp || undefined;
          }
        }
      } catch {}
    }

    const latestBetRow = dbBets[0];
    const betTimeMs = latestBetRow
      ? new Date(latestBetRow.createdAt).getTime()
      : 0;
    const sessTimeMs = Number(activeSessData?.updatedAt ?? 0);
    const latestActivityMs = Math.max(betTimeMs, sessTimeMs);
    const nowMs = Date.now();
    const isPlaying = betTimeMs >= nowMs - 15 * 60 * 1000;
    const isOnline =
      isPlaying ||
      sessTimeMs >= nowMs - 30 * 60 * 1000 ||
      betTimeMs >= nowMs - 30 * 60 * 1000;

    const ua = String(
      activeSessData?.userAgent || regDeviceData?.userAgent || ""
    ).toLowerCase();
    const platform =
      activeSessData?.platform ||
      (ua && /okhttp|dart|reactnative|capacitor|wv\)/i.test(ua) ? "app" : "web");
    const device =
      activeSessData?.device ||
      (platform === "app"
        ? ua.includes("iphone") || ua.includes("ios")
          ? "iOS App"
          : "Android APK"
        : ua.includes("android")
        ? "Android Web"
        : ua.includes("iphone") || ua.includes("ipad")
        ? "iPhone Web"
        : ua.includes("windows")
        ? "Windows PC"
        : "Web Browser");

    const gameStatus = {
      isPlaying,
      isOnline,
      platform,
      device,
      ip: rawIp || undefined,
      location: resolvedLocation,
      isp: resolvedIsp,
      lastGameName: latestBetRow
        ? latestBetRow.gameName || `Game #${latestBetRow.gameUid}`
        : undefined,
      lastActiveAt:
        latestActivityMs > 0
          ? new Date(latestActivityMs).toISOString()
          : undefined,
    };

    let rawSessions: any[] = [];
    try {
      if ((db as any).gameSession) {
        rawSessions = await (db as any).gameSession.findMany({
          where: { userId: id },
          orderBy: { startedAt: "desc" },
          take: 50,
        });
      }
    } catch (sessionErr: any) {
      console.warn("GameSession table query skipped:", sessionErr?.message);
      rawSessions = [];
    }

    const gameSessions = (rawSessions || []).map((s: any) => ({
      id: s.id,
      userId: s.userId,
      gameUid: s.gameUid,
      gameName: s.gameName,
      provider: s.provider || null,
      startBalance: Number(s.startBalance ?? 0),
      endBalance: s.endBalance !== null && s.endBalance !== undefined ? Number(s.endBalance) : null,
      netProfit: s.netProfit !== null && s.netProfit !== undefined ? Number(s.netProfit) : null,
      totalBet: Number(s.totalBet ?? 0),
      totalWin: Number(s.totalWin ?? 0),
      roundsCount: Number(s.roundsCount ?? 0),
      status: s.status || "COMPLETED",
      startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
      endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      user,
      financialOverview: {
        totalDeposits,
        totalWithdraws,
        lastDeposits,
        lastWithdraws,
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
      gameStatus,
      latestTransactions,
      betHistory,
    });
  } catch (error: any) {
    console.error("CRITICAL ERROR in GET /api/users/[id]:", error);
    return NextResponse.json(
      {
        error: error?.message || INTERNAL_SERVER_ERROR,
      },
      { status: 500 }
    );
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
