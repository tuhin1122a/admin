import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fetchSoftApiGames } from "@/lib/games-catalog";
import { INTERNAL_SERVER_ERROR } from "@/error";

function isSuperAdmin(session: any) {
  return Boolean(session?.user && (session.user as any).role === "ADMIN");
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id") || undefined;
    const q = searchParams.get("q") || undefined;
    const currencySupported = searchParams.get("currency_supported") === "1";
    const limit = Number(searchParams.get("limit") || 24);
    const offset = Number(searchParams.get("offset") || 0);
    const refresh = searchParams.get("refresh") === "1";

    const [catalogResult, hotGames, providerSettings] = await Promise.all([
      fetchSoftApiGames({
        brandId,
        q,
        currencySupported,
        limit,
        offset,
        refresh,
      }),
      db.hotGame.findMany({
        select: { id: true, gameUid: true, isActive: true, sortOrder: true },
      }),
      db.gameProviderSetting.findMany({
        select: { brandId: true, name: true, customName: true, isActive: true },
      }),
    ]);

    const hotMap = new Map(hotGames.map((h) => [h.gameUid, h]));
    const providerMap = new Map(providerSettings.map((p) => [p.brandId, p]));

    const enrichedGames = catalogResult.games.map((g) => {
      const uid = String(g.game_uid || g.game_id || "");
      const bId = String(g.brand_id || "");
      const pSetting = providerMap.get(bId);
      const hotRecord = hotMap.get(uid);

      return {
        ...g,
        game_uid: uid,
        brand_id: bId,
        provider:
          g.provider ||
          pSetting?.customName ||
          pSetting?.name ||
          `Brand #${bId}`,
        isHot: Boolean(hotRecord),
        hotGameId: hotRecord?.id || null,
        hotIsActive: hotRecord?.isActive ?? false,
        providerActive: pSetting ? pSetting.isActive : true,
      };
    });

    return NextResponse.json(
      {
        success: !catalogResult.rateLimited && !catalogResult.error,
        games: enrichedGames,
        total: catalogResult.total,
        rateLimited: Boolean(catalogResult.rateLimited),
        error: catalogResult.error,
      },
      { status: catalogResult.rateLimited ? 429 : 200 }
    );
  } catch (err) {
    console.error("GET /api/games-management/games error:", err);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

