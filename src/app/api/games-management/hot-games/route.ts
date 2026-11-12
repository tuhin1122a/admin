import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fetchSoftApiGames } from "@/lib/games-catalog";
import { INTERNAL_SERVER_ERROR } from "@/error";

function isSuperAdmin(session: any) {
  return Boolean(session?.user && (session.user as any).role === "ADMIN");
}

function normalizeGameCategory(raw?: string | null): string {
  const c = (raw || "").toLowerCase();
  if (c.includes("live") || c.includes("baccarat") || c.includes("roulette")) {
    return "live_dealers";
  }
  if (c.includes("fish") || c.includes("shoot")) return "fishing";
  if (c.includes("sport")) return "sport";
  if (c.includes("lottery") || c.includes("keno") || c.includes("bingo")) {
    return "lottery";
  }
  if (c.includes("arcade") || c.includes("crash") || c.includes("instant")) {
    return "arcade";
  }
  return "slots";
}

export async function GET() {
  try {
    const session = await auth();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [hotGames, providerSettings] = await Promise.all([
      db.hotGame.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      db.gameProviderSetting.findMany({
        select: { brandId: true, name: true, customName: true, isActive: true },
      }),
    ]);

    const providerMap = new Map(providerSettings.map((p) => [p.brandId, p]));

    const enriched = hotGames.map((hg) => {
      const pSetting = providerMap.get(hg.brandId);
      return {
        ...hg,
        providerDisplayName:
          pSetting?.customName ||
          pSetting?.name ||
          hg.providerName ||
          `Brand #${hg.brandId}`,
        providerActive: pSetting ? pSetting.isActive : true,
      };
    });

    return NextResponse.json({
      success: true,
      hotGames: enriched,
    });
  } catch (err) {
    console.error("GET /api/games-management/hot-games error:", err);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const gameUid = String(body?.gameUid || "").trim();
    if (!gameUid) {
      return NextResponse.json(
        { error: "Game UID is required" },
        { status: 400 }
      );
    }

    let brandId = String(body?.brandId || "").trim();
    let name = String(body?.name || "").trim();
    let providerName =
      typeof body?.providerName === "string" ? body.providerName.trim() : "";
    let category = typeof body?.category === "string" ? body.category.trim() : "";
    let img = typeof body?.img === "string" ? body.img.trim() : "";

    // If quick-added only with gameUid (no name or brandId), try SoftAPI lookup
    if (!name || !brandId) {
      const lookup = await fetchSoftApiGames({ q: gameUid, limit: 20, offset: 0 });
      const exactMatch =
        lookup.games.find((g) => String(g.game_uid) === gameUid) ||
        lookup.games[0];
      if (exactMatch && String(exactMatch.game_uid) === gameUid) {
        brandId = brandId || String(exactMatch.brand_id || "0");
        name = name || exactMatch.name || `Game #${gameUid}`;
        providerName = providerName || exactMatch.provider || "";
        category = category || normalizeGameCategory(exactMatch.category);
        img = img || exactMatch.logo || "";
      }
    }

    if (!name) name = `Game #${gameUid}`;
    if (!brandId) brandId = "0";
    if (!category) category = "slots";
    if (!img) img = `https://igamingapis.com/img/${gameUid}.png`;

    const existingCount = await db.hotGame.count();
    const sortOrder =
      body?.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))
        ? Math.trunc(Number(body.sortOrder))
        : existingCount + 1;

    const record = await db.hotGame.upsert({
      where: { gameUid },
      create: {
        gameUid,
        brandId,
        name,
        providerName: providerName || null,
        category,
        img,
        isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
        sortOrder,
      },
      update: {
        brandId,
        name,
        providerName: providerName || null,
        category,
        img,
        isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    return NextResponse.json({ success: true, hotGame: record }, { status: 201 });
  } catch (err) {
    console.error("POST /api/games-management/hot-games error:", err);
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

    // Batch reorder support: orderedIds: string[]
    if (Array.isArray(body?.orderedIds)) {
      const orderedIds: string[] = body.orderedIds
        .map((id: any) => String(id).trim())
        .filter(Boolean);

      await db.$transaction(
        orderedIds.map((id, idx) =>
          db.hotGame.update({
            where: { id },
            data: { sortOrder: idx + 1 },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    const id = String(body?.id || "").trim();
    const gameUid = String(body?.gameUid || "").trim();
    if (!id && !gameUid) {
      return NextResponse.json(
        { error: "HotGame id or gameUid is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
      updateData.sortOrder = Math.trunc(Number(body.sortOrder));
    }
    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body.category === "string" && body.category.trim()) {
      updateData.category = body.category.trim();
    }
    if (typeof body.img === "string") {
      updateData.img = body.img.trim();
    }

    const updated = await db.hotGame.update({
      where: id ? { id } : { gameUid },
      data: updateData,
    });

    return NextResponse.json({ success: true, hotGame: updated });
  } catch (err) {
    console.error("PATCH /api/games-management/hot-games error:", err);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

export const PUT = PATCH;

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const id = String(body?.id || "").trim();
    const gameUid = String(body?.gameUid || "").trim();

    if (!id && !gameUid) {
      return NextResponse.json(
        { error: "HotGame id or gameUid is required" },
        { status: 400 }
      );
    }

    if (id) {
      await db.hotGame.delete({ where: { id } });
    } else {
      await db.hotGame.delete({ where: { gameUid } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/games-management/hot-games error:", err);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

