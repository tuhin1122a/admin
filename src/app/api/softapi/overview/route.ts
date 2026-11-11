import { NextRequest, NextResponse } from "next/server";
import {
  getSoftApiConfig,
  saveSoftApiConfig,
  getRecentCallbackLogs,
  SOFTAPI_CATEGORY_GGR_RATES,
  SOFTAPI_ERROR_CODES,
} from "@/lib/softapi";

export async function GET() {
  try {
    const config = getSoftApiConfig();
    const hasToken = Boolean(config.token && config.token.trim().length > 0);
    const secretLength = Buffer.from(config.secret || "", "utf8").length;
    const hasValidSecret = secretLength === 32;

    let ggrWallet: number | null = null;
    let ggrStatus: "OK" | "LOW" | "NOT_CONFIGURED" | "ERROR" = "NOT_CONFIGURED";
    let ggrMessage = "Configure your SoftAPI Token to fetch live GGR balance.";

    if (hasToken) {
      try {
        const url = `${config.baseUrl}/ggr-balance?token=${encodeURIComponent(
          config.token
        )}`;
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        if (Number(data?.code) === 0 && data?.data?.wallet !== undefined) {
          ggrWallet = Number(data.data.wallet);
          ggrStatus = ggrWallet > 0 ? "OK" : "LOW";
          ggrMessage =
            ggrWallet > 0
              ? "GGR billing wallet is active and funded."
              : "GGR wallet balance is 0! Players cannot launch games until topped up.";
        } else {
          ggrStatus = "ERROR";
          ggrMessage = data?.msg || `API returned code ${data?.code ?? res.status}`;
        }
      } catch (err: any) {
        ggrStatus = "ERROR";
        ggrMessage = err?.message || "Failed to reach SoftAPI GGR endpoint.";
      }
    }

    const recentCallbacks = getRecentCallbackLogs();

    return NextResponse.json({
      config: {
        ...config,
        secretMasked: config.secret
          ? `${config.secret.slice(0, 4)}${"*".repeat(
              Math.max(0, config.secret.length - 8)
            )}${config.secret.slice(-4)}`
          : "",
        hasToken,
        secretLength,
        hasValidSecret,
      },
      ggr: {
        wallet: ggrWallet,
        status: ggrStatus,
        message: ggrMessage,
      },
      categoryRates: SOFTAPI_CATEGORY_GGR_RATES,
      errorCodes: SOFTAPI_ERROR_CODES,
      recentCallbacks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      baseUrl,
      token,
      secret,
      callbackUrl,
      returnUrl,
      defaultCurrency,
      language,
      bharatMatkaLogo,
    } = body;

    if (secret !== undefined && secret !== "") {
      const len = Buffer.from(String(secret), "utf8").length;
      if (len !== 32) {
        return NextResponse.json(
          {
            error: `Secret must be exactly 32 characters (received ${len} characters).`,
          },
          { status: 400 }
        );
      }
    }

    if (bharatMatkaLogo && String(bharatMatkaLogo).trim() !== "") {
      const logoUrl = String(bharatMatkaLogo).trim();
      if (
        !logoUrl.startsWith("https://") ||
        !logoUrl.toLowerCase().endsWith(".png")
      ) {
        return NextResponse.json(
          {
            error:
              "BHARAT MATKA logo must be a public https:// PNG URL (http, .jpg, and bare names return code 7).",
          },
          { status: 400 }
        );
      }
    }

    const updated = saveSoftApiConfig({
      ...(baseUrl !== undefined ? { baseUrl: String(baseUrl).trim() } : {}),
      ...(token !== undefined ? { token: String(token).trim() } : {}),
      ...(secret !== undefined && secret !== ""
        ? { secret: String(secret) }
        : {}),
      ...(callbackUrl !== undefined
        ? { callbackUrl: String(callbackUrl).trim() }
        : {}),
      ...(returnUrl !== undefined
        ? { returnUrl: String(returnUrl).trim() }
        : {}),
      ...(defaultCurrency !== undefined
        ? { defaultCurrency: String(defaultCurrency).trim().toUpperCase() }
        : {}),
      ...(language !== undefined ? { language: String(language).trim() } : {}),
      ...(bharatMatkaLogo !== undefined
        ? { bharatMatkaLogo: String(bharatMatkaLogo).trim() }
        : {}),
    });

    return NextResponse.json({
      success: true,
      message: "SoftAPI configuration saved successfully.",
      config: {
        ...updated,
        secretLength: Buffer.from(updated.secret || "", "utf8").length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save configuration" },
      { status: 500 }
    );
  }
}

