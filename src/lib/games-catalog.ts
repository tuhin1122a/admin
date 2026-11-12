import { db } from "@/lib/db";
import { getSoftApiConfig } from "@/lib/softapi";

export interface SoftApiProviderRaw {
  brand_id: number;
  name: string;
  logo?: string;
  game_count?: number;
  currency_supported?: boolean;
}

export interface SoftApiGameRaw {
  game_id?: number;
  game_uid: string;
  brand_id: number | string;
  name: string;
  provider?: string;
  category?: string;
  logo?: string;
  currency_supported?: boolean;
}

export interface MergedProviderItem {
  brandId: string;
  name: string;
  customName: string | null;
  displayName: string;
  logo: string;
  category: string;
  categories: string[];
  isActive: boolean;
  sortOrder: number;
  gameCount: number;
  currencySupported: boolean;
}

interface CatalogCacheStore {
  providers: { fetchedAt: number; data: SoftApiProviderRaw[] } | null;
  games: Map<
    string,
    { fetchedAt: number; total: number; games: SoftApiGameRaw[] }
  >;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

const globalForCatalog = globalThis as unknown as {
  __adminGamesCatalogCache?: CatalogCacheStore;
};

if (!globalForCatalog.__adminGamesCatalogCache) {
  globalForCatalog.__adminGamesCatalogCache = {
    providers: null,
    games: new Map(),
  };
}

const catalogCache = globalForCatalog.__adminGamesCatalogCache;

const LIVE_BRANDS = new Set([
  "55", "56", "58", "59", "60", "78", "88", "89", "114", "117", "121", "130", "132", "135",
]);
const SPORT_BRANDS = new Set([
  "46", "48", "83", "85", "94", "95", "118", "126", "141", "142",
]);
const FISHING_HYBRID_BRANDS = new Set([
  "49", "50", "51", "52", "84", "91", "99", "133",
]);
const ARCADE_BRANDS = new Set([
  "57", "100", "101", "104", "107", "111", "113", "139",
]);
const HYBRID_SLOTS_LIVE_BRANDS = new Set(["53", "54"]);

export const VALID_PROVIDER_CATEGORIES = [
  "slots",
  "live_dealers",
  "sport",
  "fishing",
  "arcade",
  "lottery",
  "card",
] as const;

export function inferProviderCategories(
  brandId: string,
  name: string
): { category: string; categories: string[] } {
  const id = String(brandId).trim();
  const lower = (name || "").toLowerCase();

  if (SPORT_BRANDS.has(id) || lower.includes("sport") || lower.includes("wicket") || lower.includes("bti") || lower.includes("saba")) {
    return { category: "sport", categories: ["sport"] };
  }
  if (
    LIVE_BRANDS.has(id) ||
    lower.includes("live") ||
    lower.includes("evolution") ||
    lower.includes("ezugi") ||
    lower.includes("dreamgaming") ||
    lower.includes("yeebet") ||
    lower.includes("sexy") ||
    lower.includes("wm casino")
  ) {
    return { category: "live_dealers", categories: ["live_dealers"] };
  }
  if (HYBRID_SLOTS_LIVE_BRANDS.has(id)) {
    return { category: "slots", categories: ["slots", "live_dealers"] };
  }
  if (
    lower.includes("lotto") ||
    lower.includes("lottery") ||
    lower.includes("bingo") ||
    lower.includes("matka") ||
    lower.includes("keno")
  ) {
    return { category: "lottery", categories: ["lottery"] };
  }
  if (FISHING_HYBRID_BRANDS.has(id)) {
    return { category: "slots", categories: ["slots", "fishing"] };
  }
  if (
    ARCADE_BRANDS.has(id) ||
    lower.includes("spribe") ||
    lower.includes("smartsoft") ||
    lower.includes("turbo") ||
    lower.includes("inout") ||
    lower.includes("galaxsys")
  ) {
    return { category: "arcade", categories: ["arcade", "slots"] };
  }

  return { category: "slots", categories: ["slots"] };
}

export async function fetchSoftApiProviders(
  forceRefresh = false
): Promise<{ providers: SoftApiProviderRaw[]; error?: string }> {
  const now = Date.now();
  if (
    !forceRefresh &&
    catalogCache.providers &&
    now - catalogCache.providers.fetchedAt < CACHE_TTL_MS
  ) {
    return { providers: catalogCache.providers.data };
  }

  const config = getSoftApiConfig();
  if (!config.token) {
    return {
      providers: catalogCache.providers?.data || [],
      error: "SoftAPI Token is not configured yet",
    };
  }

  try {
    const res = await fetch(
      `${config.baseUrl}/providers?token=${encodeURIComponent(config.token)}`,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );
    const json = await res.json();
    if (Number(json?.code) === 0 && Array.isArray(json?.data?.providers)) {
      const list: SoftApiProviderRaw[] = json.data.providers;
      catalogCache.providers = { fetchedAt: now, data: list };
      return { providers: list };
    }
    return {
      providers: catalogCache.providers?.data || [],
      error: json?.msg || "Failed to fetch SoftAPI providers",
    };
  } catch (err: any) {
    return {
      providers: catalogCache.providers?.data || [],
      error: err?.message || "Network error fetching SoftAPI providers",
    };
  }
}

export async function syncAndGetMergedProviders(options?: {
  refresh?: boolean;
  autoSyncMissing?: boolean;
}): Promise<{
  providers: MergedProviderItem[];
  syncWarning?: string;
}> {
  const refresh = Boolean(options?.refresh);
  const autoSyncMissing = options?.autoSyncMissing ?? true;

  let existingDb = await db.gameProviderSetting.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const existingByBrand = new Map(existingDb.map((row) => [row.brandId, row]));

  let liveProviders: SoftApiProviderRaw[] = [];
  let syncWarning: string | undefined;

  if (refresh || existingDb.length === 0 || autoSyncMissing) {
    const fetched = await fetchSoftApiProviders(refresh);
    liveProviders = fetched.providers;
    if (fetched.error && liveProviders.length === 0) {
      syncWarning = fetched.error;
    }
  }

  if (liveProviders.length > 0) {
    const missingToInsert = liveProviders
      .filter((lp) => !existingByBrand.has(String(lp.brand_id)))
      .map((lp, idx) => {
        const brandId = String(lp.brand_id);
        const inferred = inferProviderCategories(brandId, lp.name || "");
        const parsedOrder = Number(lp.brand_id);
        return {
          brandId,
          name: lp.name || `Provider ${brandId}`,
          logo: lp.logo || "",
          category: inferred.category,
          categories: inferred.categories,
          isActive: true,
          sortOrder: Number.isFinite(parsedOrder) ? parsedOrder : 500 + idx,
          gameCount: Number(lp.game_count || 0),
          currencySupported:
            lp.currency_supported !== undefined
              ? Boolean(lp.currency_supported)
              : true,
        };
      });

    if (missingToInsert.length > 0) {
      await db.gameProviderSetting.createMany({
        data: missingToInsert,
        skipDuplicates: true,
      });
    }

    if (refresh) {
      // Update metadata fields only (preserve Admin's customName, isActive, sortOrder, category)
      await Promise.all(
        liveProviders.map(async (lp) => {
          const brandId = String(lp.brand_id);
          const current = existingByBrand.get(brandId);
          if (!current) return;
          const nextLogo =
            !current.logo || current.logo.includes("ik.imagekit.io")
              ? lp.logo || current.logo
              : current.logo;
          await db.gameProviderSetting.update({
            where: { brandId },
            data: {
              name: lp.name || current.name,
              logo: nextLogo,
              gameCount: Number(lp.game_count ?? current.gameCount),
              currencySupported:
                lp.currency_supported !== undefined
                  ? Boolean(lp.currency_supported)
                  : current.currencySupported,
            },
          });
        })
      );
    }

    if (missingToInsert.length > 0 || refresh) {
      existingDb = await db.gameProviderSetting.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    }
  }

  const liveByBrand = new Map(
    liveProviders.map((lp) => [String(lp.brand_id), lp])
  );

  const providers: MergedProviderItem[] = existingDb.map((row) => {
    const live = liveByBrand.get(row.brandId);
    const resolvedLogo =
      row.logo && !row.logo.includes("ik.imagekit.io")
        ? row.logo
        : live?.logo || row.logo || "";

    return {
      brandId: row.brandId,
      name: row.name,
      customName: row.customName,
      displayName: row.customName?.trim() || row.name,
      logo: resolvedLogo,
      category: row.category || "slots",
      categories:
        row.categories && row.categories.length > 0
          ? row.categories
          : [row.category || "slots"],
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      gameCount: live?.game_count ?? row.gameCount ?? 0,
      currencySupported:
        live?.currency_supported !== undefined
          ? Boolean(live.currency_supported)
          : row.currencySupported,
    };
  });

  return { providers, syncWarning };
}

export async function fetchSoftApiGames(params: {
  brandId?: string;
  q?: string;
  currencySupported?: boolean;
  limit?: number;
  offset?: number;
  refresh?: boolean;
}): Promise<{
  games: SoftApiGameRaw[];
  total: number;
  rateLimited?: boolean;
  error?: string;
}> {
  const brandId = params.brandId && params.brandId !== "all" ? params.brandId : "";
  const q = (params.q || "").trim();
  const limit = Math.min(Math.max(params.limit || 24, 1), 100);
  const offset = Math.max(params.offset || 0, 0);
  const currencySupported = Boolean(params.currencySupported);

  const cacheKey = JSON.stringify({
    brandId,
    q: q.toLowerCase(),
    currencySupported,
    limit,
    offset,
  });

  const now = Date.now();
  const cached = catalogCache.games.get(cacheKey);
  if (!params.refresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { games: cached.games, total: cached.total };
  }

  const config = getSoftApiConfig();
  if (!config.token) {
    return {
      games: [],
      total: 0,
      error: "SoftAPI Token is not configured yet",
    };
  }

  try {
    const query = new URLSearchParams({
      token: config.token,
      limit: String(limit),
      offset: String(offset),
    });
    if (brandId) query.set("brand_id", brandId);
    if (q) query.set("q", q);
    if (currencySupported) query.set("currency_supported", "1");

    const res = await fetch(`${config.baseUrl}/games?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After") || "60";
      if (cached) {
        return { games: cached.games, total: cached.total };
      }
      return {
        games: [],
        total: 0,
        rateLimited: true,
        error: `SoftAPI rate limit reached (20 req/min). Please retry in ${retryAfter}s.`,
      };
    }

    const json = await res.json();
    if (Number(json?.code) === 0 && Array.isArray(json?.data?.games)) {
      const games: SoftApiGameRaw[] = json.data.games;
      const total = Number(json.data.total ?? games.length);

      // Trim cache size to keep memory bounded
      if (catalogCache.games.size > 150) {
        const oldestKey = catalogCache.games.keys().next().value;
        if (oldestKey) catalogCache.games.delete(oldestKey);
      }
      catalogCache.games.set(cacheKey, { fetchedAt: now, games, total });
      return { games, total };
    }

    return {
      games: cached?.games || [],
      total: cached?.total || 0,
      error: json?.msg || "Failed to load games from SoftAPI",
    };
  } catch (err: any) {
    return {
      games: cached?.games || [],
      total: cached?.total || 0,
      error: err?.message || "Network error loading SoftAPI games",
    };
  }
}

