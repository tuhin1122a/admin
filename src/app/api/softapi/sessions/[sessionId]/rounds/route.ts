import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRecentCallbackLogs, toNumericUserId } from "@/lib/softapi";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "sessionId is required" },
        { status: 400 }
      );
    }

    const session = await db.gameSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, playerId: true, phone: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Game session not found" },
        { status: 404 }
      );
    }

    // Define time window for this specific session with a small +/- 2 minute safety margin
    const sessionStart = new Date(new Date(session.startedAt).getTime() - 2 * 60 * 1000);
    const sessionEnd = new Date(
      (session.endedAt ? new Date(session.endedAt).getTime() : new Date(session.updatedAt).getTime()) +
        2 * 60 * 1000
    );

    // 1. Fetch rounds from BetHistory table for this session's time window
    const betHistoryRows = await db.betHistory.findMany({
      where: {
        userId: session.userId,
        gameUid: session.gameUid,
        createdAt: {
          gte: sessionStart,
          lte: sessionEnd,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch from recent SoftAPI callback logs if BetHistory is empty or partial
    const numUserId = toNumericUserId(session.user.playerId || session.user.id);
    const recentLogs = getRecentCallbackLogs();
    const logRounds: any[] = [];

    for (const l of recentLogs) {
      const memAcc = String(l.member_account).trim();
      const isUserMatch =
        memAcc === session.user.playerId ||
        memAcc === session.user.id ||
        memAcc === session.user.phone ||
        memAcc === String(numUserId);

      if (isUserMatch && String(l.game_uid) === session.gameUid) {
        const logTime = new Date(l.receivedAt || l.timestamp).getTime();
        if (logTime >= sessionStart.getTime() && logTime <= sessionEnd.getTime()) {
          logRounds.push({
            serialNumber: l.serial_number,
            gameUid: l.game_uid,
            gameName: l.game_name || session.gameName,
            gameRound: l.game_round,
            betAmount: Number(l.bet_amount ?? 0),
            winAmount: Number(l.win_amount ?? 0),
            multiplier:
              Number(l.bet_amount ?? 0) > 0
                ? Number((Number(l.win_amount ?? 0) / Number(l.bet_amount ?? 0)).toFixed(2))
                : 0,
            creditAmount: Number(l.credit_amount ?? 0),
            status:
              Number(l.win_amount ?? 0) > Number(l.bet_amount ?? 0)
                ? "WIN"
                : Number(l.win_amount ?? 0) === Number(l.bet_amount ?? 0) && Number(l.bet_amount ?? 0) > 0
                ? "REFUND"
                : "LOSS",
            freeSpinBonus: l.free_spin_bonus,
            createdAt: l.receivedAt || l.timestamp,
          });
        }
      }
    }

    // Merge betHistoryRows with logRounds deduplicating by serialNumber
    const seenSerials = new Set<string>();
    const rounds: any[] = [];

    for (const b of betHistoryRows) {
      if (!seenSerials.has(b.serialNumber)) {
        seenSerials.add(b.serialNumber);
        const bAmt = Number(b.betAmount);
        const wAmt = Number(b.winAmount);
        rounds.push({
          serialNumber: b.serialNumber,
          gameUid: b.gameUid,
          gameName: b.gameName,
          gameRound: b.gameRound,
          betAmount: bAmt,
          winAmount: wAmt,
          multiplier: bAmt > 0 ? Number((wAmt / bAmt).toFixed(2)) : 0,
          creditAmount: Number(b.creditAmount),
          status: b.status,
          freeSpinBonus: b.freeSpinBonus,
          createdAt: b.createdAt.toISOString(),
        });
      }
    }

    for (const l of logRounds) {
      if (!seenSerials.has(l.serialNumber)) {
        seenSerials.add(l.serialNumber);
        rounds.push(l);
      }
    }

    // Sort rounds descending by time
    rounds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        gameName: session.gameName,
        gameUid: session.gameUid,
        provider: session.provider,
        startBalance: Number(session.startBalance),
        endBalance: session.endBalance !== null ? Number(session.endBalance) : null,
        netProfit: session.netProfit !== null ? Number(session.netProfit) : null,
        totalBet: Number(session.totalBet),
        totalWin: Number(session.totalWin),
        roundsCount: Math.max(session.roundsCount, rounds.length),
        status: session.status,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      },
      rounds,
    });
  } catch (error: any) {
    console.error("Error fetching session rounds:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch session rounds" },
      { status: 500 }
    );
  }
}
