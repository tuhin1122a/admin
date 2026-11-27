/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeFilter = (searchParams.get("type") || "ALL").toUpperCase(); // ALL | CALLBACK | LAUNCH | 9W_TRANSFER | ERROR
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));

    const nowMs = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Fetch recent BetHistory, SoftAPI Event Buffer, and Active 9Wicket Sessions in parallel
    const [betRows, bufferRow, active9WRows, todayCallbackCount] = await Promise.all([
      db.betHistory
        .findMany({
          take: 300,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                playerId: true,
              },
            },
          },
        })
        .catch(() => []),
      db.siteConfig
        .findUnique({ where: { key: "SOFTAPI_LIVE_LOGS_BUFFER" } })
        .catch(() => null),
      db.siteConfig
        .findMany({
          where: { key: { startsWith: "NINE_WICKET_SESSION_" } },
          select: { key: true, value: true },
        })
        .catch(() => []),
      db.betHistory
        .count({
          where: { createdAt: { gte: startOfToday } },
        })
        .catch(() => 0),
    ]);

    let bufferLogs: any[] = [];
    if (bufferRow?.value) {
      try {
        const parsed = JSON.parse(bufferRow.value);
        if (Array.isArray(parsed)) bufferLogs = parsed;
      } catch {
        bufferLogs = [];
      }
    }

    // Count active 9Wicket sessions
    let open9WSessionsCount = 0;
    let total9WLockedBalance = 0;
    for (const row of active9WRows) {
      try {
        const parsed = JSON.parse(row.value);
        if (parsed?.status === "open") {
          open9WSessionsCount++;
          total9WLockedBalance += Number(parsed.creditedAmount ?? 0);
        }
      } catch {
        // ignore
      }
    }

    // Convert BetHistory rows into standardized SoftAPI Callback Log entries
    const callbackLogs = betRows.map((b) => {
      const betAmt = Number(b.betAmount ?? 0);
      const winAmt = Number(b.winAmount ?? 0);
      const creditAmt = Number(b.creditAmount ?? 0);
      const beforeAmt = Math.max(0, Number((creditAmt + betAmt - winAmt).toFixed(2)));
      const is9W = b.gameUid === "11539" || b.provider === "9Wicket" || b.serialNumber.startsWith("9W_");

      return {
        id: `bet-${b.id}`,
        type: is9W ? "9W_TRANSFER" : "CALLBACK",
        status: "SUCCESS",
        userId: b.userId,
        phone: b.user?.phone || b.memberAccount,
        playerId: b.user?.playerId || b.memberAccount,
        memberAccount: b.memberAccount,
        gameUid: b.gameUid,
        gameName: b.gameName || `Game #${b.gameUid}`,
        provider: b.provider || (is9W ? "9Wicket" : "SoftAPI"),
        category: b.category || "slots",
        serialNumber: b.serialNumber,
        gameRound: b.gameRound || b.serialNumber,
        betAmount: betAmt,
        winAmount: winAmt,
        creditAmount: creditAmt,
        walletBefore: beforeAmt,
        walletAfter: creditAmt,
        roundResult: b.status,
        code: 0,
        message: is9W
          ? `9Wicket Settled Match Bet (${b.status})`
          : `Round Settled (${b.status}): Bet ৳${betAmt.toFixed(2)} → Win ৳${winAmt.toFixed(2)}`,
        requestPayload: {
          endpoint: "/api/softapi/callback",
          encryption: "AES-256-ECB (PKCS7)",
          decrypted_payload: {
            serial_number: b.serialNumber,
            member_account: b.memberAccount,
            game_uid: b.gameUid,
            game_name: b.gameName,
            game_round: b.gameRound || b.serialNumber,
            bet_amount: betAmt,
            win_amount: winAmt,
            credit_amount: creditAmt,
            ...(b.freeSpinBonus ? { free_spin_bonus: b.freeSpinBonus } : {}),
          },
        },
        responsePayload: {
          http_status: 200,
          body: {
            code: 0,
            msg: "OK",
            credit_amount: creditAmt,
            timestamp: new Date(b.createdAt).getTime(),
          },
        },
        createdAt: new Date(b.createdAt).toISOString(),
      };
    });

    // Convert bufferLogs (Launch, 9W Transfer, Error) into standardized entries
    const formattedBufferLogs = bufferLogs.map((item) => ({
      id: `buf-${item.id}`,
      type: item.type || "LAUNCH",
      status: item.status || "SUCCESS",
      userId: item.userId,
      phone: item.phone || item.memberAccount || "Unknown",
      playerId: item.phone || item.memberAccount || "Unknown",
      memberAccount: item.memberAccount || item.phone || "Unknown",
      gameUid: item.gameUid || "-",
      gameName: item.gameName || (item.gameUid ? `Game #${item.gameUid}` : "SoftAPI"),
      provider: item.type === "9W_TRANSFER" ? "9Wicket" : "SoftAPI",
      category: item.type === "9W_TRANSFER" ? "sports" : "casino",
      serialNumber: item.serialNumber || item.id,
      gameRound: item.serialNumber || "-",
      betAmount: Number(item.betAmount ?? 0),
      winAmount: Number(item.winAmount ?? 0),
      creditAmount: Number(item.creditAmount ?? item.walletAfter ?? 0),
      walletBefore: Number(item.walletBefore ?? 0),
      walletAfter: Number(item.walletAfter ?? 0),
      roundResult: item.status,
      code: item.code ?? 0,
      message: item.message || "SoftAPI Event",
      requestPayload: item.requestPayload || {},
      responsePayload: item.responsePayload || {},
      createdAt: item.createdAt || new Date().toISOString(),
    }));

    // Merge and sort by newest first
    const allLogs = [...formattedBufferLogs, ...callbackLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const errorCount = allLogs.filter(
      (l) => l.type === "ERROR" || l.status === "ERROR"
    ).length;
    const launchCount = allLogs.filter((l) => l.type === "LAUNCH").length;
    const lastCallbackAt = allLogs.length > 0 ? allLogs[0].createdAt : null;

    // Apply Type & Search filters
    let filtered = allLogs;
    if (typeFilter !== "ALL") {
      if (typeFilter === "ERROR") {
        filtered = filtered.filter(
          (l) => l.type === "ERROR" || l.status === "ERROR"
        );
      } else {
        filtered = filtered.filter((l) => l.type === typeFilter);
      }
    }

    if (search) {
      filtered = filtered.filter(
        (l) =>
          String(l.phone || "")
            .toLowerCase()
            .includes(search) ||
          String(l.playerId || "")
            .toLowerCase()
            .includes(search) ||
          String(l.memberAccount || "")
            .toLowerCase()
            .includes(search) ||
          String(l.gameName || "")
            .toLowerCase()
            .includes(search) ||
          String(l.gameUid || "")
            .toLowerCase()
            .includes(search) ||
          String(l.serialNumber || "")
            .toLowerCase()
            .includes(search) ||
          String(l.message || "")
            .toLowerCase()
            .includes(search)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      summary: {
        todayCallbackCount,
        lastCallbackAt,
        open9WSessionsCount,
        total9WLockedBalance: Number(total9WLockedBalance.toFixed(2)),
        errorCount,
        launchCount,
        serverTimeMs: nowMs,
      },
      logs: paginated,
    });
  } catch (error: any) {
    console.error("Failed to fetch SoftAPI logs:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load SoftAPI logs",
      },
      { status: 500 }
    );
  }
}
