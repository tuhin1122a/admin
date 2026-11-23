import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getSoftApiConfig,
  softApiDecrypt,
  appendCallbackLog,
  getRecentCallbackLogs,
  toNumericUserId,
} from "@/lib/softapi";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const config = getSoftApiConfig();
    let data: Record<string, any> = {};

    try {
      data = await req.json();
    } catch {
      return new NextResponse("OK", { status: 200 });
    }

    // If account enc=1, POST is wrapped as { "payload": "<base64 AES>", "timestamp": ... }
    if (data && typeof data.payload === "string" && data.payload.length > 0) {
      if (!config.secret || Buffer.from(config.secret, "utf8").length !== 32) {
        appendCallbackLog({
          serial_number: "ENC_NO_SECRET_" + Date.now(),
          member_account: "unknown",
          game_uid: "unknown",
          bet_amount: 0,
          win_amount: 0,
          credit_amount: 0,
          timestamp: String(data.timestamp || Date.now()),
          receivedAt: new Date().toISOString(),
          status: "ERROR",
          note: "Encrypted callback received (enc=1), but 32-char secret is not configured",
        });
        return new NextResponse("OK", { status: 200 });
      }
      data = softApiDecrypt(data.payload, config.secret);
    }

    const serial = String(data.serial_number || "").trim();
    const memberAccount = String(data.member_account || "").trim();
    const gameUid = String(data.game_uid ?? data.game_id ?? "");
    const gameName = String(data.game_name || "");
    const gameRound = String(data.game_round || "");
    const betAmount = Number(data.bet_amount ?? 0);
    const winAmount = Number(data.win_amount ?? 0);
    const creditAmount = Number(data.credit_amount ?? 0);
    const freeSpinBonus = data.free_spin_bonus
      ? String(data.free_spin_bonus)
      : undefined;

    if (!serial || !memberAccount) {
      return new NextResponse("OK", { status: 200 });
    }

    // Idempotency check in local logs
    const existingLogs = getRecentCallbackLogs();
    if (
      existingLogs.some(
        (l) => l.serial_number === serial && l.status === "PROCESSED"
      )
    ) {
      appendCallbackLog({
        serial_number: serial,
        member_account: memberAccount,
        game_uid: gameUid,
        game_name: gameName,
        game_round: gameRound,
        bet_amount: betAmount,
        win_amount: winAmount,
        credit_amount: creditAmount,
        free_spin_bonus: freeSpinBonus,
        timestamp: String(data.timestamp || ""),
        receivedAt: new Date().toISOString(),
        status: "DUPLICATE",
        note: "Skipped duplicate serial_number",
      });
      return new NextResponse("OK", { status: 200 });
    }

    // Check database idempotency via BetHistory or Transaction table if available
    try {
      const [existingBet, existingTx] = await Promise.all([
        db.betHistory.findUnique({ where: { serialNumber: serial } }),
        db.transaction.findUnique({ where: { transactionId: serial } }),
      ]);
      if (existingBet || existingTx) {
        appendCallbackLog({
          serial_number: serial,
          member_account: memberAccount,
          game_uid: gameUid,
          game_name: gameName,
          game_round: gameRound,
          bet_amount: betAmount,
          win_amount: winAmount,
          credit_amount: creditAmount,
          free_spin_bonus: freeSpinBonus,
          timestamp: String(data.timestamp || ""),
          receivedAt: new Date().toISOString(),
          status: "DUPLICATE",
          note: "Already stored in BetHistory/Transaction table",
        });
        return new NextResponse("OK", { status: 200 });
      }
    } catch {
      // continue if check fails
    }

    // Find matching User in database (by playerId, id, phone, or numeric hash match)
    let matchedUser = await db.user.findFirst({
      where: {
        OR: [
          { playerId: memberAccount },
          { id: memberAccount },
          { phone: memberAccount },
          { gameXAPlayerId: memberAccount },
        ],
      },
      include: { wallet: true, bettingRecord: true },
    });

    if (!matchedUser && /^\d+$/.test(memberAccount)) {
      // Fallback: check if any user's hashed numeric playerId matches memberAccount
      const targetNum = parseInt(memberAccount, 10);
      const candidates = await db.user.findMany({
        take: 500,
        select: { id: true, playerId: true },
      });
      const hit = candidates.find(
        (u) =>
          toNumericUserId(u.playerId) === targetNum ||
          toNumericUserId(u.id) === targetNum
      );
      if (hit) {
        matchedUser = await db.user.findUnique({
          where: { id: hit.id },
          include: { wallet: true, bettingRecord: true },
        });
      }
    }

    if (!matchedUser) {
      appendCallbackLog({
        serial_number: serial,
        member_account: memberAccount,
        game_uid: gameUid,
        game_name: gameName,
        game_round: gameRound,
        bet_amount: betAmount,
        win_amount: winAmount,
        credit_amount: creditAmount,
        free_spin_bonus: freeSpinBonus,
        timestamp: String(data.timestamp || ""),
        receivedAt: new Date().toISOString(),
        status: "USER_NOT_FOUND",
        note: `No user matched member_account=${memberAccount}`,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // Reconcile player wallet balance from credit_amount & update betting record + betHistory
    const roundStatus =
      winAmount > betAmount
        ? "WIN"
        : winAmount === betAmount && betAmount > 0
        ? "REFUND"
        : "LOSS";

    try {
      await db.$transaction(
        async (tx) => {
          // 1. Insert BetHistory first — unique constraint on serialNumber guarantees idempotency
          await tx.betHistory.create({
            data: {
              serialNumber: serial,
              userId: matchedUser.id,
              memberAccount,
              gameUid: gameUid || "unknown",
              gameName: gameName || `Game #${gameUid || "unknown"}`,
              gameRound: gameRound || null,
              betAmount,
              winAmount,
              creditAmount,
              status: roundStatus,
              freeSpinBonus: freeSpinBonus || null,
            },
          });

          if (matchedUser?.wallet) {
            const currentTurnover = Number(matchedUser.wallet.turnOver || 0);
            const deductedTurnover =
              betAmount > 0
                ? Math.max(0, Number((currentTurnover - betAmount).toFixed(2)))
                : currentTurnover;
            const nextTurnover = creditAmount < 1 ? 0 : deductedTurnover;

            await tx.wallet.update({
              where: { userId: matchedUser.id },
              data: {
                balance: creditAmount,
                turnOver: nextTurnover,
              },
            });
          }

          await tx.bettingRecord.upsert({
            where: { userId: matchedUser.id },
            create: {
              userId: matchedUser.id,
              totalBet: betAmount,
              totalWin: winAmount,
            },
            update: {
              totalBet: { increment: betAmount },
              totalWin: { increment: winAmount },
            },
          });

          // 4. Update or rotate GameSession (Entry vs Exit Balance tracking)
          try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            let activeSession = await tx.gameSession.findFirst({
              where: {
                userId: matchedUser.id,
                gameUid: gameUid || "unknown",
                status: "ACTIVE",
                updatedAt: { gte: fifteenMinutesAgo },
              },
              orderBy: { createdAt: "desc" },
            });

            if (activeSession) {
              const startBal = Number(activeSession.startBalance);
              const newTotalBet = Number(activeSession.totalBet) + betAmount;
              const newTotalWin = Number(activeSession.totalWin) + winAmount;
              const netProfit = Number((creditAmount - startBal).toFixed(2));

              await tx.gameSession.update({
                where: { id: activeSession.id },
                data: {
                  endBalance: creditAmount,
                  totalBet: newTotalBet,
                  totalWin: newTotalWin,
                  netProfit,
                  roundsCount: { increment: 1 },
                  endedAt: new Date(),
                },
              });
            } else {
              // Close any other active sessions
              await tx.gameSession.updateMany({
                where: { userId: matchedUser.id, status: "ACTIVE" },
                data: { status: "COMPLETED", endedAt: new Date() },
              });

              // Initial start balance prior to this round
              const calculatedStartBal = Math.max(0, Number((creditAmount - winAmount + betAmount).toFixed(2)));
              const netProfit = Number((creditAmount - calculatedStartBal).toFixed(2));

              await tx.gameSession.create({
                data: {
                  userId: matchedUser.id,
                  gameUid: gameUid || "unknown",
                  gameName: gameName || `Game #${gameUid || "unknown"}`,
                  startBalance: calculatedStartBal,
                  endBalance: creditAmount,
                  netProfit,
                  totalBet: betAmount,
                  totalWin: winAmount,
                  roundsCount: 1,
                  status: "ACTIVE",
                  startedAt: new Date(),
                  endedAt: new Date(),
                },
              });
            }
          } catch (sessionErr) {
            console.error("GameSession update in callback error:", sessionErr);
          }
        },
        {
          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (txErr: any) {
      if (
        txErr instanceof Prisma.PrismaClientKnownRequestError &&
        txErr.code === "P2002"
      ) {
        return new NextResponse("OK", { status: 200 });
      }
      throw txErr;
    }

    appendCallbackLog({
      serial_number: serial,
      member_account: memberAccount,
      game_uid: gameUid,
      game_name: gameName,
      game_round: gameRound,
      bet_amount: betAmount,
      win_amount: winAmount,
      credit_amount: creditAmount,
      free_spin_bonus: freeSpinBonus,
      timestamp: String(data.timestamp || ""),
      receivedAt: new Date().toISOString(),
      status: "PROCESSED",
      note: `Updated wallet balance to ${creditAmount} for user ${matchedUser.playerId}`,
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("SoftAPI callback error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

