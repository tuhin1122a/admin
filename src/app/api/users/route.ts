import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRecentCallbackLogs, toNumericUserId } from "@/lib/softapi";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentAdminId = session?.user?.id;

    const { searchParams } = new URL(req.url);

    // Filters
    const status = searchParams.get("status") || "all"; // banned | unbanned | all
    const search = searchParams.get("search") || "";
    const agentFilter = searchParams.get("agentId");

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

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

    // Total count for pagination
    const total = await db.user.count({ where });

    // Fetch paginated users with wallet and bettingRecord
    const rawUsers = await db.user.findMany({
      where,
      select: {
        id: true,
        playerId: true,
        phone: true,
        isBanned: true,
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
      skip,
      take: limit,
    });

    const userIds = rawUsers.map((u) => u.id);

    // Aggregate deposits and withdraws in parallel for these users
    const [depositSums, withdrawSums] = await Promise.all([
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
    ]);

    const depositMap = new Map<string, number>();
    for (const d of depositSums) {
      depositMap.set(d.userId, Number(d._sum.amount ?? 0));
    }

    const withdrawMap = new Map<string, number>();
    for (const w of withdrawSums) {
      withdrawMap.set(w.userId, Number(w._sum.amount ?? 0));
    }

    // Read recent SoftAPI callback logs to check for active in-game sessions
    const recentLogs = getRecentCallbackLogs();
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

    const formattedUsers = rawUsers.map((user) => {
      // If user is banned, their balance is considered 0 and not counted
      const balance = user.isBanned ? 0 : Number(user.wallet?.balance ?? 0);
      const currency = user.wallet?.currency || "BDT";
      const turnOver = Number(user.wallet?.turnOver ?? 0);

      const totalBet = Number(user.bettingRecord?.totalBet ?? 0);
      const totalWin = Number(user.bettingRecord?.totalWin ?? 0);
      const winRate =
        totalBet > 0 ? Number(((totalWin / totalBet) * 100).toFixed(2)) : 0;

      const totalDeposit = depositMap.get(user.id) ?? 0;
      const totalWithdraw = withdrawMap.get(user.id) ?? 0;
      const netProfit = totalDeposit - totalWithdraw;

      // Check if user has active game activity in recent callbacks
      const numUserId = toNumericUserId(user.playerId || user.id);
      const matchedLog = recentLogs.find((l) => {
        const memAcc = String(l.member_account).trim();
        return (
          memAcc === user.playerId ||
          memAcc === user.id ||
          memAcc === user.phone ||
          memAcc === String(numUserId)
        );
      });

      let isPlaying = false;
      let lastGameName: string | undefined = undefined;
      let lastActiveAt: string | undefined = undefined;

      if (matchedLog) {
        lastGameName = matchedLog.game_name || `Game #${matchedLog.game_uid}`;
        lastActiveAt = matchedLog.receivedAt;
        const logTime = new Date(matchedLog.receivedAt).getTime();
        if (logTime >= fifteenMinutesAgo) {
          isPlaying = true;
        }
      }

      return {
        id: user.id,
        playerId: user.playerId,
        phone: user.phone,
        isBanned: user.isBanned,
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
        },
        financials: {
          totalDeposit,
          totalWithdraw,
          netProfit,
        },
        gameStatus: {
          isPlaying,
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

    return NextResponse.json({
      success: true,
      total,
      page: +page,
      limit: +limit,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users." },
      { status: 500 }
    );
  }
}
