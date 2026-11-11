import { NextRequest, NextResponse } from "next/server";
import {
  getSoftApiConfig,
  softApiEncrypt,
  toNumericUserId,
} from "@/lib/softapi";

export async function POST(req: NextRequest) {
  try {
    const config = getSoftApiConfig();
    if (!config.token || !config.secret) {
      return NextResponse.json(
        {
          code: 1,
          msg: "SoftAPI Token and 32-character Secret must be configured before launching a game.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      user_id = 1001,
      balance = 100,
      game_uid,
      currency_code,
      language,
      return_url,
      callback_url,
      logo,
    } = body;

    if (!game_uid) {
      return NextResponse.json(
        { code: 400, msg: "game_uid is required to launch a game." },
        { status: 400 }
      );
    }

    const numericUserId = toNumericUserId(user_id);
    const plainPayload: Record<string, any> = {
      user_id: numericUserId,
      balance: Number(balance),
      game_uid: String(game_uid),
      token: config.token,
      timestamp: Date.now(), // Unix milliseconds (+/- 60s)
      return: return_url || config.returnUrl,
      callback: callback_url || config.callbackUrl,
      currency_code: (currency_code || config.defaultCurrency || "BDT").toUpperCase(),
      language: language || config.language || "en",
    };

    const effectiveLogo = logo || config.bharatMatkaLogo;
    if (
      effectiveLogo &&
      effectiveLogo.startsWith("https://") &&
      effectiveLogo.toLowerCase().endsWith(".png")
    ) {
      plainPayload.logo = effectiveLogo;
    }

    const encryptedPayload = softApiEncrypt(plainPayload, config.secret);

    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: config.token,
        payload: encryptedPayload,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();
    return NextResponse.json({
      ...data,
      debug_plain_fields: {
        user_id: plainPayload.user_id,
        balance: plainPayload.balance,
        game_uid: plainPayload.game_uid,
        currency_code: plainPayload.currency_code,
        timestamp: plainPayload.timestamp,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 500,
        msg: error?.message || "Game launch request failed",
      },
      { status: 500 }
    );
  }
}

