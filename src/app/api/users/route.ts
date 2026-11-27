import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

function getCategoryGgrRate(category?: string | null, gameUid?: string | null, provider?: string | null): number {
  const uid = String(gameUid || "").trim();
  const prov = String(provider || "").trim().toUpperCase();
  const cat = String(category || "").trim().toLowerCase();

  if (uid === "11539" || prov === "9W" || prov.includes("9WICKET")) {
    return 0.135; // 13.5% for 9Wicket
  }
  if (prov.includes("IG ORIGINAL") || cat.includes("original")) {
    return 0; // 0%
  }
  if (cat.includes("live") || prov.includes("EVOLUTION") || prov.includes("EZUGI")) {
    return 0.08; // 8% Live Casino
  }
  if (cat.includes("sport")) {
    return 0.07; // 7% Sports
  }
  if (cat.includes("crash") || cat.includes("arcade") || cat.includes("table") || cat.includes("fish")) {
    return 0.065; // 6.5% Other / Crash / Table
  }
  return 0.06; // 6% Slots default
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentAdminId = session?.user?.id;

    const { searchParams } = new URL(req.url);

    // Filters
    const status = searchParams.get("status") || "all"; // banned | unbanned | active | playing | today | top_ggr | all
    const search = searchParams.get("search") || "";
    const agentFilter = searchParams.get("agentId");

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    // Where clause
    const where: any = {};

    // If Sub-Admin, strictly isolate and only show their own players
    if (currentRole === "SUBADMIN") {
      where.subAdminId = currentAdminId;
    } else if (agentFilter) {
      where.subAdminId = agentFilter;
    }

    if (status === "banned") {
      where.isBanned = true;
    } else if (status === "unbanned") {
      where.isBanned = false;
    }

    if (search) {
      where.OR = [
        { playerId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const isActivityFilter = ["active", "playing", "today", "top_ggr"].includes(status);

    // Fetch users matching base filter
    const rawUsers = await db.user.findMany({
      where,
      select: {
        id: true,
        playerId: true,
        phone: true,
        isBanned: true,
        canDeposit: true,
        canWithdraw: true,
        canPlayGame: true,
        canClaimBonus: true,
        createdAt: true,
        subAdminId: true,
        subAdmin: {
          select: {
            id: true,
            name: true,
            agentCode: true,
          },
        },
        wallet: {
          select: {
            balance: true,
            currency: true,
            turnOver: true,
          },
        },
        bettingRecord: {
          select: {
            totalBet: true,
            totalWin: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(isActivityFilter ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    const totalBaseCount = isActivityFilter
      ? rawUsers.length
      : await db.user.count({ where });

    const userIds = rawUsers.map((u) => u.id);
    const sessionKeys = userIds.map((id) => `active_session:${id}`);

    // Aggregate deposits, withdraws, bonuses, bet history & active sessions in parallel
    const [
      depositSums,
      withdrawSums,
      signinList,
      inviteList,
      spinSums,
      userBets,
      activeSessionRows,
    ] = await Promise.all([
      db.deposit.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          status: "APPROVED",
        },
        _sum: { amount: true },
      }),
      db.withdraw.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          status: "APPROVED",
        },
        _sum: { amount: true },
      }),
      db.claimedSigninReward
        .findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, reward: { select: { prize: true } } },
        })
        .catch(() => []),
      db.claimedInvitationReward
        .findMany({
          where: { invitationBonus: { userId: { in: userIds } } },
          select: {
            invitationBonus: { select: { userId: true } },
            reward: { select: { prize: true } },
          },
        })
        .catch(() => []),
      db.luckyWheelSpin
        .groupBy({
          by: ["userId"],
          where: { userId: { in: userIds } },
          _sum: { prizeValue: true },
        })
        .catch(() => []),
      db.betHistory
        .findMany({
          where: { userId: { in: userIds } },
          select: {
            userId: true,
            gameName: true,
            gameUid: true,
            provider: true,
            category: true,
            betAmount: true,
            winAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        })
        .catch(() => []),
      db.siteConfig
        .findMany({
          where: { key: { in: sessionKeys } },
          select: { key: true, value: true },
        })
        .catch(() => []),
    ]);

    const depositMap = new Map<string, number>();
    for (const d of depositSums) {
      depositMap.set(d.userId, Number(d._sum.amount ?? 0));
    }

    const withdrawMap = new Map<string, number>();
    for (const w of withdrawSums) {
      withdrawMap.set(w.userId, Number(w._sum.amount ?? 0));
    }

    const dailyBonusMap = new Map<string, number>();
    for (const r of signinList as any[]) {
      const uId = r.userId;
      dailyBonusMap.set(
        uId,
        (dailyBonusMap.get(uId) ?? 0) + Number(r.reward?.prize ?? 0)
      );
    }

    const referralBonusMap = new Map<string, number>();
    for (const r of inviteList as any[]) {
      const uId = r.invitationBonus?.userId;
      if (uId) {
        referralBonusMap.set(
          uId,
          (referralBonusMap.get(uId) ?? 0) + Number(r.reward?.prize ?? 0)
        );
      }
    }

    const spinBonusMap = new Map<string, number>();
    for (const s of spinSums as any[]) {
      spinBonusMap.set(s.userId, Number(s._sum?.prizeValue ?? 0));
    }

    // Map active_session:<userId> from SiteConfig
    const sessionMap = new Map<
      string,
      { updatedAt: number; platform: string }
    >();
    for (const row of activeSessionRows) {
      const uid = row.key.replace("active_session:", "");
      try {
        const parsed = JSON.parse(row.value);
        if (parsed?.updatedAt) {
          sessionMap.set(uid, {
            updatedAt: Number(parsed.updatedAt),
            platform: parsed.platform || "web",
          });
        }
      } catch {
        // ignore invalid json
      }
    }

    // Aggregate per-user latest bet & exact GGR deduction from BetHistory
    const latestBetMap = new Map<
      string,
      { gameName: string; createdAt: Date }
    >();
    const userGgrFromBetsMap = new Map<string, number>();
    const userBetSumFromHistoryMap = new Map<string, number>();
    const userWinSumFromHistoryMap = new Map<string, number>();

    for (const bet of userBets) {
      const uid = bet.userId;
      if (!latestBetMap.has(uid)) {
        latestBetMap.set(uid, {
          gameName: bet.gameName || `Game #${bet.gameUid}`,
          createdAt: bet.createdAt,
        });
      }

      const bAmt = Number(bet.betAmount ?? 0);
      const wAmt = Number(bet.winAmount ?? 0);
      userBetSumFromHistoryMap.set(
        uid,
        (userBetSumFromHistoryMap.get(uid) ?? 0) + bAmt
      );
      userWinSumFromHistoryMap.set(
        uid,
        (userWinSumFromHistoryMap.get(uid) ?? 0) + wAmt
      );

      // GGR is deducted on net loss rounds (when betAmount > winAmount)
      if (bAmt > wAmt) {
        const lossAmt = bAmt - wAmt;
        const rate = getCategoryGgrRate(bet.category, bet.gameUid, bet.provider);
        userGgrFromBetsMap.set(
          uid,
          (userGgrFromBetsMap.get(uid) ?? 0) + lossAmt * rate
        );
      }
    }

    const nowMs = Date.now();
    const fifteenMinutesAgo = nowMs - 15 * 60 * 1000;
    const thirtyMinutesAgo = nowMs - 30 * 60 * 1000;
    const twentyFourHoursAgo = nowMs - 24 * 60 * 60 * 1000;

    let formattedUsers = rawUsers.map((user) => {
      const balance = user.isBanned ? 0 : Number(user.wallet?.balance ?? 0);
      const currency = user.wallet?.currency || "BDT";
      const turnOver = Number(user.wallet?.turnOver ?? 0);

      const recordBet = Number(user.bettingRecord?.totalBet ?? 0);
      const recordWin = Number(user.bettingRecord?.totalWin ?? 0);
      const historyBet = userBetSumFromHistoryMap.get(user.id) ?? 0;
      const historyWin = userWinSumFromHistoryMap.get(user.id) ?? 0;

      const totalBet = Math.max(recordBet, historyBet);
      const totalWin = Math.max(recordWin, historyWin);
      const winRate =
        totalBet > 0 ? Number(((totalWin / totalBet) * 100).toFixed(2)) : 0;

      // Net amount the player lost in games
      const playerNetLoss = Number(Math.max(0, totalBet - totalWin).toFixed(2));

      // Exact GGR deducted from SoftAPI GGR wallet by this user
      const ggrFromHistory = userGgrFromBetsMap.get(user.id) ?? 0;
      const fallbackGgr = playerNetLoss * 0.06;
      const ggrDeducted = Number(
        Math.max(ggrFromHistory, fallbackGgr).toFixed(2)
      );

      const totalDeposit = depositMap.get(user.id) ?? 0;
      const totalWithdraw = withdrawMap.get(user.id) ?? 0;
      const netProfit = totalDeposit - totalWithdraw;

      const dailyBonus = dailyBonusMap.get(user.id) ?? 0;
      const referralBonus = referralBonusMap.get(user.id) ?? 0;
      const spinBonus = spinBonusMap.get(user.id) ?? 0;
      const totalBonuses = dailyBonus + referralBonus + spinBonus;

      // Determine real live game & online status from BetHistory + SiteConfig active_session
      const latestBet = latestBetMap.get(user.id);
      const activeSess = sessionMap.get(user.id);

      const betTimeMs = latestBet
        ? new Date(latestBet.createdAt).getTime()
        : 0;
      const sessTimeMs = activeSess?.updatedAt ?? 0;
      const latestActivityMs = Math.max(betTimeMs, sessTimeMs);

      const isPlaying = betTimeMs >= fifteenMinutesAgo;
      const isOnline =
        isPlaying || sessTimeMs >= thirtyMinutesAgo || betTimeMs >= thirtyMinutesAgo;
      const lastGameName = latestBet?.gameName;
      const lastActiveAt =
        latestActivityMs > 0
          ? new Date(latestActivityMs).toISOString()
          : undefined;

      return {
        id: user.id,
        playerId: user.playerId,
        phone: user.phone,
        isBanned: user.isBanned,
        canDeposit: user.canDeposit ?? true,
        canWithdraw: user.canWithdraw ?? true,
        canPlayGame: user.canPlayGame ?? true,
        canClaimBonus: user.canClaimBonus ?? true,
        createdAt: user.createdAt,
        wallet: {
          balance,
          currency,
          turnOver,
        },
        bettingRecord: {
          totalBet,
          totalWin,
          winRate,
          playerNetLoss,
          ggrDeducted,
        },
        financials: {
          totalDeposit,
          totalWithdraw,
          netProfit,
        },
        bonuses: {
          dailyBonus,
          referralBonus,
          spinBonus,
          totalBonuses,
        },
        gameStatus: {
          isPlaying,
          isOnline,
          platform: activeSess?.platform || "web",
          lastGameName,
          lastActiveAt,
        },
        subAdmin: user.subAdmin
          ? {
              id: user.subAdmin.id,
              name: user.subAdmin.name,
              agentCode: user.subAdmin.agentCode,
            }
          : null,
      };
    });

    // Compute global active summary across fetched users
    let livePlayingCount = 0;
    let onlineNowCount = 0;
    let activeTodayCount = 0;
    let totalPlayerNetLoss = 0;
    let totalGgrDeducted = 0;

    for (const u of formattedUsers) {
      totalPlayerNetLoss += u.bettingRecord.playerNetLoss ?? 0;
      totalGgrDeducted += u.bettingRecord.ggrDeducted ?? 0;
      if (u.gameStatus.isPlaying) livePlayingCount++;
      if (u.gameStatus.isOnline) onlineNowCount++;
      if (
        u.gameStatus.lastActiveAt &&
        new Date(u.gameStatus.lastActiveAt).getTime() >= twentyFourHoursAgo
      ) {
        activeTodayCount++;
      }
    }

    // Apply activity filter if requested
    if (status === "playing") {
      formattedUsers = formattedUsers.filter((u) => u.gameStatus.isPlaying);
    } else if (status === "active") {
      formattedUsers = formattedUsers.filter(
        (u) => u.gameStatus.isOnline || Boolean(u.gameStatus.lastActiveAt)
      );
      formattedUsers.sort((a, b) => {
        const tA = a.gameStatus.lastActiveAt
          ? new Date(a.gameStatus.lastActiveAt).getTime()
          : 0;
        const tB = b.gameStatus.lastActiveAt
          ? new Date(b.gameStatus.lastActiveAt).getTime()
          : 0;
        return tB - tA;
      });
    } else if (status === "today") {
      formattedUsers = formattedUsers.filter(
        (u) =>
          u.gameStatus.lastActiveAt &&
          new Date(u.gameStatus.lastActiveAt).getTime() >= twentyFourHoursAgo
      );
      formattedUsers.sort((a, b) => {
        const tA = a.gameStatus.lastActiveAt
          ? new Date(a.gameStatus.lastActiveAt).getTime()
          : 0;
        const tB = b.gameStatus.lastActiveAt
          ? new Date(b.gameStatus.lastActiveAt).getTime()
          : 0;
        return tB - tA;
      });
    } else if (status === "top_ggr") {
      formattedUsers = formattedUsers.filter(
        (u) => (u.bettingRecord.ggrDeducted ?? 0) > 0 || u.bettingRecord.totalBet > 0
      );
      formattedUsers.sort(
        (a, b) =>
          (b.bettingRecord.ggrDeducted ?? 0) - (a.bettingRecord.ggrDeducted ?? 0)
      );
    }

    const finalTotal = isActivityFilter ? formattedUsers.length : totalBaseCount;
    const paginatedUsers = isActivityFilter
      ? formattedUsers.slice((page - 1) * limit, page * limit)
      : formattedUsers;

    return NextResponse.json({
      success: true,
      total: finalTotal,
      page: +page,
      limit: +limit,
      summary: {
        livePlayingCount,
        onlineNowCount,
        activeTodayCount,
        totalPlayerNetLoss: Number(totalPlayerNetLoss.toFixed(2)),
        totalGgrDeducted: Number(totalGgrDeducted.toFixed(2)),
      },
      users: paginatedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users." },
      { status: 500 }
    );
  }
}
