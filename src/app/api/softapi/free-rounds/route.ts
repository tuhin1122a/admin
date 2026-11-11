import { NextRequest, NextResponse } from "next/server";
import {
  getSoftApiConfig,
  softApiEncrypt,
  toNumericUserId,
} from "@/lib/softapi";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const config = getSoftApiConfig();
    if (!config.token || !config.secret) {
      return NextResponse.json(
        {
          code: 1,
          msg: "SoftAPI Token and 32-character Secret must be configured first.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      action = "create", // "create" | "cancel"
      user_identifier, // playerId, phone, or numeric user_id
      game_uid,
      bonus_code,
      currency_code,
      total_bet = "5",
      rounds = 10,
      duration_hours = 48,
      start_date,
      expiration_date,
    } = body;

    if (!user_identifier || !game_uid || !bonus_code) {
      return NextResponse.json(
        {
          code: 400,
          msg: "user_identifier, game_uid, and bonus_code are required.",
        },
        { status: 400 }
      );
    }

    const cleanBonusCode = String(bonus_code).trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(cleanBonusCode)) {
      return NextResponse.json(
        {
          code: 400,
          msg: "bonus_code must contain only A-Z, 0-9, _, - (max 64 chars).",
        },
        { status: 400 }
      );
    }

    // Try resolving user from database if phone or playerId was entered
    let resolvedUserId: number;
    let matchedUserInfo: { id: string; phone: string; playerId: string } | null =
      null;

    try {
      const dbUser = await db.user.findFirst({
        where: {
          OR: [
            { playerId: String(user_identifier).trim() },
            { phone: String(user_identifier).trim() },
            { id: String(user_identifier).trim() },
          ],
        },
        select: { id: true, phone: true, playerId: true },
      });

      if (dbUser) {
        matchedUserInfo = dbUser;
        resolvedUserId = toNumericUserId(dbUser.playerId || dbUser.id);
      } else {
        resolvedUserId = toNumericUserId(user_identifier);
      }
    } catch {
      resolvedUserId = toNumericUserId(user_identifier);
    }

    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);

    if (action === "cancel") {
      const cancelPlain = {
        user_id: resolvedUserId,
        game_uid: String(game_uid).trim(),
        bonus_code: cleanBonusCode,
        timestamp: nowMs,
      };

      const encrypted = softApiEncrypt(cancelPlain, config.secret);
      const res = await fetch(`${config.baseUrl}/free-rounds/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: config.token,
          payload: encrypted,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });

      const data = await res.json();
      return NextResponse.json({
        ...data,
        resolved_user_id: resolvedUserId,
        matched_user: matchedUserInfo,
      });
    }

    // Create Free Rounds
    const numRounds = Math.min(500, Math.max(1, Number(rounds) || 10));
    const startSec = start_date ? Number(start_date) : nowSec;
    const expSec = expiration_date
      ? Number(expiration_date)
      : startSec + Math.max(1, Number(duration_hours) || 48) * 3600;

    const createPlain = {
      user_id: resolvedUserId,
      game_uid: String(game_uid).trim(),
      bonus_code: cleanBonusCode,
      currency_code: (
        currency_code ||
        config.defaultCurrency ||
        "BDT"
      ).toUpperCase(),
      total_bet: String(total_bet),
      rounds: numRounds,
      start_date: startSec,
      expiration_date: expSec,
      timestamp: nowMs,
    };

    const encrypted = softApiEncrypt(createPlain, config.secret);
    const res = await fetch(`${config.baseUrl}/free-rounds/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: config.token,
        payload: encrypted,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json();
    return NextResponse.json({
      ...data,
      resolved_user_id: resolvedUserId,
      matched_user: matchedUserInfo,
      sent_payload: createPlain,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 500,
        msg: error?.message || "Free rounds request failed",
      },
      { status: 500 }
    );
  }
}

