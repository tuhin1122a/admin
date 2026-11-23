import { auth } from "@/auth";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { fetchSoftApiGames } from "@/lib/games-catalog";
import { NextRequest, NextResponse } from "next/server";

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
    const q = (searchParams.get("q") || "").trim();
    const currencySupported = searchParams.get("currency_supported") === "1";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 24), 1), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);
    const refresh = searchParams.get("refresh") === "1";

    const isSpecificBrand = Boolean(brandId && brandId !== "all");

    const [catalogResult, hotGames, providerSettings, gameSettings] =
      await Promise.all([
        fetchSoftApiGames({
          brandId,
          // When viewing a specific provider, fetch its full catalog (up to 500) so custom serial sorting applies across the entire provider before pagination
          q: isSpecificBrand ? undefined : q || undefined,
          currencySupported,
          limit: isSpecificBrand ? 500 : limit,
          offset: isSpecificBrand ? 0 : offset,
          refresh,
        }),
        db.hotGame.findMany({
          select: { id: true, gameUid: true, isActive: true, sortOrder: true },
        }),
        db.gameProviderSetting.findMany({
          select: {
            brandId: true,
            name: true,
            customName: true,
            isActive: true,
            sortOrder: true,
          },
        }),
        db.providerGameSetting.findMany({
          where: isSpecificBrand ? { brandId: String(brandId) } : undefined,
        }),
      ]);

    const hotMap = new Map(hotGames.map((h) => [h.gameUid, h]));
    const providerMap = new Map(providerSettings.map((p) => [p.brandId, p]));
    const gameSettingMap = new Map(gameSettings.map((gs) => [gs.gameUid, gs]));

    let enrichedGames = catalogResult.games.map((g, idx) => {
      const uid = String(g.game_uid || g.game_id || "");
      const bId = String(g.brand_id || "");
      const pSetting = providerMap.get(bId);
      const hotRecord = hotMap.get(uid);
      const gSetting = gameSettingMap.get(uid);

      const sortOrder = gSetting ? gSetting.sortOrder : 9999;
      const isGameActive = gSetting ? gSetting.isActive : true;
      const displayName = gSetting?.customName?.trim() || g.name;
      const displayLogo = gSetting?.img?.trim() || g.logo;

      return {
        ...g,
        name: displayName,
        originalName: g.name,
        logo: displayLogo,
        game_uid: uid,
        brand_id: bId,
        provider:
          pSetting?.customName ||
          g.provider ||
          pSetting?.name ||
          `Brand #${bId}`,
        isHot: Boolean(hotRecord),
        hotGameId: hotRecord?.id || null,
        hotIsActive: hotRecord?.isActive ?? false,
        providerActive: pSetting ? pSetting.isActive : true,
        providerSortOrder: pSetting ? pSetting.sortOrder : 9999,
        sortOrder,
        hasCustomOrder: sortOrder < 9999,
        isGameActive,
        _originalIdx: idx,
      };
    });

    if (isSpecificBrand) {
      // Sort entire provider catalog by custom serial first, then original index
      enrichedGames.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a._originalIdx - b._originalIdx;
      });

      // Assign 1-based serial number within this provider
      enrichedGames = enrichedGames.map((g, idx) => ({
        ...g,
        providerSerial: idx + 1,
      }));

      if (q) {
        const qLower = q.toLowerCase();
        enrichedGames = enrichedGames.filter(
          (g) =>
            g.name?.toLowerCase().includes(qLower) ||
            g.originalName?.toLowerCase().includes(qLower) ||
            g.game_uid.toLowerCase().includes(qLower)
        );
      }

      const filteredTotal = enrichedGames.length;
      const pagedGames = enrichedGames.slice(offset, offset + limit);

      return NextResponse.json(
        {
          success: !catalogResult.rateLimited && !catalogResult.error,
          games: pagedGames,
          total: filteredTotal,
          rateLimited: Boolean(catalogResult.rateLimited),
          error: catalogResult.error,
        },
        { status: catalogResult.rateLimited ? 429 : 200 }
      );
    }

    // For "all" providers view, sort current page by custom game sortOrder then providerSortOrder
    enrichedGames.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      if (a.providerSortOrder !== b.providerSortOrder) {
        return a.providerSortOrder - b.providerSortOrder;
      }
      return a._originalIdx - b._originalIdx;
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Batch reorder games under a provider
    if (body?.action === "reorder" && Array.isArray(body.games) && body.brandId) {
      const bId = String(body.brandId).trim();
      const items: Array<{
        gameUid: string;
        name?: string;
        img?: string;
        category?: string;
        sortOrder: number;
      }> = body.games;

      await db.$transaction(
        items.map((item, idx) => {
          const uid = String(item.gameUid).trim();
          const order = Number.isFinite(Number(item.sortOrder))
            ? Math.max(1, Math.trunc(Number(item.sortOrder)))
            : idx + 1;
          return db.providerGameSetting.upsert({
            where: { gameUid: uid },
            create: {
              gameUid: uid,
              brandId: bId,
              name: item.name || `Game #${uid}`,
              img: item.img || null,
              category: item.category || "slots",
              isActive: true,
              sortOrder: order,
            },
            update: {
              sortOrder: order,
            },
          });
        })
      );

      return NextResponse.json({ success: true });
    }

    const gameUid = String(body?.gameUid || "").trim();
    const brandId = String(body?.brandId || "").trim();
    if (!gameUid || !brandId) {
      return NextResponse.json(
        { error: "gameUid and brandId are required" },
        { status: 400 }
      );
    }

    // Move a game to #1 under its provider (shifts existing custom-sorted games of this provider down by +1)
    if (body?.action === "move-top") {
      const existingBrandGames = await db.providerGameSetting.findMany({
        where: {
          brandId,
          gameUid: { not: gameUid },
          sortOrder: { lt: 9999 },
        },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      });

      await db.$transaction([
        db.providerGameSetting.upsert({
          where: { gameUid },
          create: {
            gameUid,
            brandId,
            name: String(body.name || `Game #${gameUid}`),
            img: body.img ? String(body.img) : null,
            category: body.category ? String(body.category) : "slots",
            isActive: true,
            sortOrder: 1,
          },
          update: {
            sortOrder: 1,
          },
        }),
        ...existingBrandGames.map((row, idx) =>
          db.providerGameSetting.update({
            where: { gameUid: row.gameUid },
            data: { sortOrder: idx + 2 },
          })
        ),
      ]);

      return NextResponse.json({ success: true, sortOrder: 1 });
    }

    // Reset a game's custom serial back to default (9999)
    if (body?.action === "reset-serial") {
      await db.providerGameSetting.updateMany({
        where: { gameUid },
        data: { sortOrder: 9999 },
      });
      return NextResponse.json({ success: true, sortOrder: 9999 });
    }

    // Set exact serial number (1, 2, 3...) or toggle isActive / customName
    const updateData: Record<string, any> = {};
    if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
      updateData.sortOrder = Math.max(1, Math.trunc(Number(body.sortOrder)));
    }
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    if (typeof body.customName === "string") {
      updateData.customName = body.customName.trim() || null;
    }
    if (typeof body.img === "string" && body.img.trim()) {
      updateData.img = body.img.trim();
    }

    // If setting a specific serial (e.g. 1, 2, 3), shift other custom-ordered games in this provider so serials stay unique
    if (updateData.sortOrder !== undefined && updateData.sortOrder < 9999) {
      const targetOrder = updateData.sortOrder;
      const others = await db.providerGameSetting.findMany({
        where: {
          brandId,
          gameUid: { not: gameUid },
          sortOrder: { lt: 9999 },
        },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      });

      const conflictExists = others.some((o) => o.sortOrder === targetOrder);
      if (conflictExists) {
        await db.$transaction(
          others
            .filter((o) => o.sortOrder >= targetOrder)
            .map((o) =>
              db.providerGameSetting.update({
                where: { gameUid: o.gameUid },
                data: { sortOrder: o.sortOrder + 1 },
              })
            )
        );
      }
    }

    const saved = await db.providerGameSetting.upsert({
      where: { gameUid },
      create: {
        gameUid,
        brandId,
        name: String(body.name || `Game #${gameUid}`),
        customName: updateData.customName ?? null,
        img: updateData.img ? String(updateData.img) : null,
        category: body.category ? String(body.category) : "slots",
        isActive: updateData.isActive ?? true,
        sortOrder: updateData.sortOrder ?? 9999,
      },
      update: updateData,
    });

    if (updateData.img) {
      await db.hotGame.updateMany({
        where: { gameUid },
        data: { img: updateData.img },
      });
    }

    return NextResponse.json({ success: true, gameSetting: saved });
  } catch (err) {
    console.error("PATCH /api/games-management/games error:", err);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

export const POST = PATCH;
export const PUT = PATCH;

