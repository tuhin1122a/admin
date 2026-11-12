import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  inferProviderCategories,
  syncAndGetMergedProviders,
} from "@/lib/games-catalog";
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
    const refresh = searchParams.get("refresh") === "1";

    const { providers, syncWarning } = await syncAndGetMergedProviders({
      refresh,
      autoSyncMissing: true,
    });

    const total = providers.length;
    const activeCount = providers.filter((p) => p.isActive).length;
    const inactiveCount = total - activeCount;

    return NextResponse.json({
      success: true,
      providers,
      summary: {
        total,
        activeCount,
        inactiveCount,
      },
      syncWarning,
    });
  } catch (err) {
    console.error("GET /api/games-management/providers error:", err);
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

    if (body?.action === "sync") {
      const { providers, syncWarning } = await syncAndGetMergedProviders({
        refresh: true,
        autoSyncMissing: true,
      });
      return NextResponse.json({
        success: true,
        providers,
        syncWarning,
      });
    }

    if (body?.action === "bulk-active") {
      const brandIds: string[] = Array.isArray(body.brandIds)
        ? body.brandIds.map((id: any) => String(id).trim()).filter(Boolean)
        : [];
      const nextActive = Boolean(body.isActive);

      if (brandIds.length === 0) {
        await db.gameProviderSetting.updateMany({
          data: { isActive: nextActive },
        });
      } else {
        await db.gameProviderSetting.updateMany({
          where: { brandId: { in: brandIds } },
          data: { isActive: nextActive },
        });
      }

      return NextResponse.json({ success: true });
    }

    const brandId = String(body?.brandId || "").trim();
    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    const existing = await db.gameProviderSetting.findUnique({
      where: { brandId },
    });

    const updateData: Record<string, any> = {};
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
      updateData.sortOrder = Math.trunc(Number(body.sortOrder));
    }
    if (typeof body.customName === "string") {
      updateData.customName = body.customName.trim() || null;
    }
    if (typeof body.logo === "string") {
      updateData.logo = body.logo.trim();
    }
    if (typeof body.category === "string" && body.category.trim()) {
      const cleanCat = body.category.trim();
      updateData.category = cleanCat;
      if (!Array.isArray(body.categories)) {
        const currentCats = existing?.categories || [];
        updateData.categories = Array.from(new Set([cleanCat, ...currentCats.filter(Boolean)]));
        // Ensure clean primary replacement if switching single category
        if (currentCats.length <= 1) {
          updateData.categories = [cleanCat];
        }
      }
    }
    if (Array.isArray(body.categories)) {
      const cleaned = body.categories
        .map((c: any) => String(c).trim())
        .filter(Boolean);
      if (cleaned.length > 0) {
        updateData.categories = Array.from(new Set(cleaned));
        if (!updateData.category) {
          updateData.category = cleaned[0];
        }
      }
    }

    if (existing) {
      const updated = await db.gameProviderSetting.update({
        where: { brandId },
        data: updateData,
      });
      return NextResponse.json({ success: true, provider: updated });
    }

    const fallbackName = String(body.name || `Provider ${brandId}`).trim();
    const inferred = inferProviderCategories(brandId, fallbackName);
    const created = await db.gameProviderSetting.create({
      data: {
        brandId,
        name: fallbackName,
        customName: updateData.customName ?? null,
        logo: updateData.logo ?? "",
        category: updateData.category ?? inferred.category,
        categories: updateData.categories ?? inferred.categories,
        isActive: updateData.isActive ?? true,
        sortOrder: updateData.sortOrder ?? (Number(brandId) || 0),
        gameCount: Number(body.gameCount || 0),
        currencySupported:
          body.currencySupported !== undefined
            ? Boolean(body.currencySupported)
            : true,
      },
    });

    return NextResponse.json({ success: true, provider: created });
  } catch (err) {
    console.error("PATCH /api/games-management/providers error:", err);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

export const PUT = PATCH;
export const POST = PATCH;

