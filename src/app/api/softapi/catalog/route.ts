import { NextRequest, NextResponse } from "next/server";
import { getSoftApiConfig } from "@/lib/softapi";

export async function GET(req: NextRequest) {
  try {
    const config = getSoftApiConfig();
    if (!config.token) {
      return NextResponse.json(
        {
          code: 400,
          msg: "SoftAPI Token is not configured yet. Please add your token in the API Configuration tab.",
          data: null,
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "providers";

    if (type === "demo") {
      const gameUid = searchParams.get("game_uid");
      if (!gameUid) {
        return NextResponse.json(
          { code: 400, msg: "Missing game_uid parameter", data: null },
          { status: 400 }
        );
      }
      const demoUrl = `${config.baseUrl}/demo?token=${encodeURIComponent(
        config.token
      )}&game_uid=${encodeURIComponent(gameUid)}`;
      const res = await fetch(demoUrl, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const text = (await res.text()).trim();
      // Section 6: Success body is ONLY the URL (text/plain) -- no JSON wrapper. Errors are JSON.
      if (text.startsWith("http://") || text.startsWith("https://")) {
        return NextResponse.json({
          code: 0,
          msg: "Demo trial URL fetched",
          data: { url: text },
        });
      }
      try {
        const errJson = JSON.parse(text);
        return NextResponse.json(errJson, {
          status: res.ok ? 200 : res.status,
        });
      } catch {
        return NextResponse.json(
          {
            code: res.status || 1008,
            msg: text || "Demo not supported for this game",
            data: null,
          },
          { status: 400 }
        );
      }
    }

    if (type === "providers") {
      const params = new URLSearchParams({ token: config.token });
      if (searchParams.get("currency_supported") === "1") {
        params.set("currency_supported", "1");
      }
      const res = await fetch(
        `${config.baseUrl}/providers?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (type === "provider-currencies") {
      const params = new URLSearchParams({ token: config.token });
      const currency = searchParams.get("currency");
      const brandId = searchParams.get("brand_id");
      const q = searchParams.get("q");
      if (currency) params.set("currency", currency);
      if (brandId) params.set("brand_id", brandId);
      if (q) params.set("q", q);

      const res = await fetch(
        `${config.baseUrl}/provider-currencies?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (type === "games") {
      const params = new URLSearchParams({ token: config.token });
      const brandId = searchParams.get("brand_id");
      const limit = searchParams.get("limit") || "60";
      const offset = searchParams.get("offset") || "0";
      const q = searchParams.get("q");
      const currencySupported = searchParams.get("currency_supported");

      if (brandId && brandId !== "all") params.set("brand_id", brandId);
      params.set("limit", limit);
      params.set("offset", offset);
      if (q) params.set("q", q);
      if (currencySupported === "1") params.set("currency_supported", "1");

      const res = await fetch(`${config.baseUrl}/games?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "60";
        return NextResponse.json(
          {
            code: 429,
            msg: `Games API rate limit reached (20 req/min). Retry after ${retryAfter}s.`,
            data: null,
          },
          { status: 429 }
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { code: 400, msg: "Unsupported catalog query type" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 500,
        msg: error?.message || "Failed to query SoftAPI catalog",
        data: null,
      },
      { status: 500 }
    );
  }
}

