import { NextRequest, NextResponse } from "next/server";
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

    // Check database idempotency via Transaction table if available
    try {
      const existingTx = await db.transaction.findUnique({
        where: { transactionId: serial },
      });
      if (existingTx) {
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
          note: "Already stored in Transaction table",
        });
        return new NextResponse("OK", { status: 200 });
      }
    } catch {
      // continue if Transaction check fails
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

    // Reconcile player wallet balance from credit_amount & update betting record
    await db.$transaction(async (tx) => {
      if (matchedUser?.wallet) {
        await tx.wallet.update({
          where: { userId: matchedUser.id },
          data: {
            balance: creditAmount,
            turnOver: { increment: betAmount },
          },
        });
      }

      if (matchedUser?.bettingRecord) {
        await tx.bettingRecord.update({
          where: { userId: matchedUser.id },
          data: {
            totalBet: { increment: betAmount },
            totalWin: { increment: winAmount },
          },
        });
      } else {
        await tx.bettingRecord.create({
          data: {
            userId: matchedUser.id,
            totalBet: betAmount,
            totalWin: winAmount,
          },
        });
      }
    });

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

