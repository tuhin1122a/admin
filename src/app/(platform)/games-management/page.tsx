"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CookieLoader from "@/components/loaders/cookie-loader";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Flame,
  Gamepad2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

interface ProviderRow {
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

interface CatalogGameRow {
  game_id?: number;
  game_uid: string;
  brand_id: string;
  name: string;
  provider?: string;
  category?: string;
  logo?: string;
  currency_supported?: boolean;
  isHot: boolean;
  providerActive: boolean;
}

interface HotGameRow {
  id: string;
  gameUid: string;
  brandId: string;
  name: string;
  providerName: string | null;
  providerDisplayName?: string;
  providerActive?: boolean;
  category: string;
  img: string | null;
  isActive: boolean;
  sortOrder: number;
}

const CATEGORY_OPTIONS = [
  { value: "slots", label: "Slots" },
  { value: "live_dealers", label: "Live Casino" },
  { value: "sport", label: "Sports" },
  { value: "fishing", label: "Fishing" },
  { value: "arcade", label: "Arcade" },
  { value: "lottery", label: "Lottery" },
  { value: "card", label: "Card" },
];

function normalizeCategoryValue(raw?: string): string {
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
  if (c.includes("card") || c.includes("poker")) return "card";
  return "slots";
}

export default function GamesManagementPage() {
  const [activeTab, setActiveTab] = useState("providers");

  // Providers state
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [syncingProviders, setSyncingProviders] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [providerCatFilter, setProviderCatFilter] = useState("all");
  const [providerStatusFilter, setProviderStatusFilter] = useState("all");
  const [updatingBrandId, setUpdatingBrandId] = useState<string | null>(null);
  const [brokenProviderLogos, setBrokenProviderLogos] = useState<
    Record<string, boolean>
  >({});

  // Edit Provider Modal
  const [editingProvider, setEditingProvider] = useState<ProviderRow | null>(
    null
  );
  const [editCustomName, setEditCustomName] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [editCategory, setEditCategory] = useState("slots");
  const [editCategories, setEditCategories] = useState<string[]>(["slots"]);
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [savingProviderEdit, setSavingProviderEdit] = useState(false);

  // All Games state
  const [games, setGames] = useState<CatalogGameRow[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesLoadedOnce, setGamesLoadedOnce] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState("all");
  const [gameSearch, setGameSearch] = useState("");
  const [currencyOnly, setCurrencyOnly] = useState(false);
  const [gameOffset, setGameOffset] = useState(0);
  const [brokenGameImgs, setBrokenGameImgs] = useState<Record<string, boolean>>(
    {}
  );
  const [togglingHotUid, setTogglingHotUid] = useState<string | null>(null);
  const [launchingDemoUid, setLaunchingDemoUid] = useState<string | null>(null);

  // Hot Games state
  const [hotGames, setHotGames] = useState<HotGameRow[]>([]);
  const [loadingHot, setLoadingHot] = useState(true);
  const [quickUid, setQuickUid] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickCategory, setQuickCategory] = useState("slots");
  const [addingQuickHot, setAddingQuickHot] = useState(false);

  const loadProviders = useCallback(async (refresh = false) => {
    try {
      if (refresh) setSyncingProviders(true);
      else setLoadingProviders(true);

      const res = await fetch(
        `/api/games-management/providers${refresh ? "?refresh=1" : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data?.success && Array.isArray(data.providers)) {
        setProviders(data.providers);
        if (data.syncWarning) {
          toast.warning(data.syncWarning);
        } else if (refresh) {
          toast.success(`Synced ${data.providers.length} SoftAPI providers`);
        }
      } else {
        toast.error(data?.error || "Failed to load providers");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load providers");
    } finally {
      setLoadingProviders(false);
      setSyncingProviders(false);
    }
  }, []);

  const loadHotGames = useCallback(async () => {
    try {
      setLoadingHot(true);
      const res = await fetch("/api/games-management/hot-games", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.hotGames)) {
        setHotGames(data.hotGames);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load hot games");
    } finally {
      setLoadingHot(false);
    }
  }, []);

  const loadCatalogGames = useCallback(
    async (
      offsetVal = 0,
      brand = selectedBrandId,
      query = gameSearch,
      curOnly = currencyOnly
    ) => {
      try {
        setLoadingGames(true);
        const params = new URLSearchParams({
          limit: "24",
          offset: String(offsetVal),
        });
        if (brand && brand !== "all") params.set("brand_id", brand);
        if (query.trim()) params.set("q", query.trim());
        if (curOnly) params.set("currency_supported", "1");

        const res = await fetch(
          `/api/games-management/games?${params.toString()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setGamesLoadedOnce(true);
        if (Array.isArray(data?.games)) {
          setGames(data.games);
          setTotalGames(Number(data.total || data.games.length));
          setGameOffset(offsetVal);
        }
        if (data?.error) {
          toast.warning(data.error);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load games");
      } finally {
        setLoadingGames(false);
      }
    },
    [selectedBrandId, gameSearch, currencyOnly]
  );

  useEffect(() => {
    loadProviders(false);
    loadHotGames();
  }, [loadProviders, loadHotGames]);

  useEffect(() => {
    if (activeTab === "games" && !gamesLoadedOnce && !loadingGames) {
      loadCatalogGames(0);
    }
  }, [activeTab, gamesLoadedOnce, loadingGames, loadCatalogGames]);

  const filteredProviders = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    return providers.filter((p) => {
      if (q) {
        const matchesName =
          p.name.toLowerCase().includes(q) ||
          (p.customName || "").toLowerCase().includes(q) ||
          p.brandId.toLowerCase().includes(q);
        if (!matchesName) return false;
      }
      if (providerCatFilter !== "all") {
        const cats = p.categories?.length ? p.categories : [p.category];
        if (p.category !== providerCatFilter && !cats.includes(providerCatFilter)) {
          return false;
        }
      }
      if (providerStatusFilter === "active" && !p.isActive) return false;
      if (providerStatusFilter === "inactive" && p.isActive) return false;
      return true;
    });
  }, [providers, providerSearch, providerCatFilter, providerStatusFilter]);

  const activeProviderCount = useMemo(
    () => providers.filter((p) => p.isActive).length,
    [providers]
  );
  const inactiveProviderCount = providers.length - activeProviderCount;

  const updateProviderField = async (
    brandId: string,
    payload: Record<string, any>,
    successMsg?: string
  ) => {
    try {
      setUpdatingBrandId(brandId);
      const res = await fetch("/api/games-management/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Failed to update provider");
        return false;
      }

      setProviders((prev) =>
        prev
          .map((p) => {
            if (p.brandId !== brandId) return p;
            const nextCategory = payload.category ?? p.category;
            const nextCategories = Array.isArray(payload.categories)
              ? payload.categories
              : payload.category
              ? Array.from(
                  new Set([
                    payload.category,
                    ...(p.categories || []).filter(Boolean),
                  ])
                )
              : p.categories;
            const nextCustomName =
              payload.customName !== undefined
                ? payload.customName || null
                : p.customName;
            return {
              ...p,
              isActive:
                payload.isActive !== undefined
                  ? Boolean(payload.isActive)
                  : p.isActive,
              sortOrder:
                payload.sortOrder !== undefined
                  ? Number(payload.sortOrder)
                  : p.sortOrder,
              category: nextCategory,
              categories: nextCategories,
              customName: nextCustomName,
              displayName: nextCustomName || p.name,
              logo: payload.logo !== undefined ? payload.logo : p.logo,
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );

      if (successMsg) toast.success(successMsg);
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
      return false;
    } finally {
      setUpdatingBrandId(null);
    }
  };

  const handleBulkToggleFiltered = async (nextActive: boolean) => {
    const brandIds = filteredProviders.map((p) => p.brandId);
    if (brandIds.length === 0) return;

    const confirmMsg = `${
      nextActive ? "Enable" : "Disable"
    } ${brandIds.length} filtered provider(s)?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setSyncingProviders(true);
      const res = await fetch("/api/games-management/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-active",
          brandIds,
          isActive: nextActive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Bulk update failed");
        return;
      }
      const idSet = new Set(brandIds);
      setProviders((prev) =>
        prev.map((p) =>
          idSet.has(p.brandId) ? { ...p, isActive: nextActive } : p
        )
      );
      toast.success(
        `${nextActive ? "Enabled" : "Disabled"} ${brandIds.length} providers`
      );
    } catch (err: any) {
      toast.error(err?.message || "Bulk update failed");
    } finally {
      setSyncingProviders(false);
    }
  };

  const openEditProviderModal = (p: ProviderRow) => {
    setEditingProvider(p);
    setEditCustomName(p.customName || "");
    setEditLogo(p.logo || "");
    setEditCategory(p.category || "slots");
    setEditCategories(p.categories?.length ? p.categories : [p.category]);
    setEditSortOrder(String(p.sortOrder ?? 0));
  };

  const handleSaveProviderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setSavingProviderEdit(true);
    const cleanedCats = Array.from(
      new Set([editCategory, ...editCategories.filter(Boolean)])
    );
    const ok = await updateProviderField(
      editingProvider.brandId,
      {
        customName: editCustomName.trim(),
        logo: editLogo.trim(),
        category: editCategory,
        categories: cleanedCats,
        sortOrder: Number(editSortOrder) || 0,
      },
      `Updated ${editCustomName.trim() || editingProvider.name}`
    );
    setSavingProviderEdit(false);
    if (ok) setEditingProvider(null);
  };

  const handleToggleGameHot = async (game: CatalogGameRow) => {
    const uid = String(game.game_uid);
    try {
      setTogglingHotUid(uid);
      if (game.isHot) {
        const res = await fetch("/api/games-management/hot-games", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameUid: uid }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          toast.error(data?.error || "Failed to remove from Hot Games");
          return;
        }
        setGames((prev) =>
          prev.map((g) => (g.game_uid === uid ? { ...g, isHot: false } : g))
        );
        toast.success(`Removed "${game.name}" from Hot Games`);
      } else {
        const res = await fetch("/api/games-management/hot-games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameUid: uid,
            brandId: String(game.brand_id),
            name: game.name,
            providerName: game.provider || "",
            category: normalizeCategoryValue(game.category),
            img: game.logo || `https://igamingapis.com/img/${uid}.png`,
            isActive: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          toast.error(data?.error || "Failed to add Hot Game");
          return;
        }
        setGames((prev) =>
          prev.map((g) => (g.game_uid === uid ? { ...g, isHot: true } : g))
        );
        toast.success(`Added "${game.name}" to Hot Games`);
      }
      await loadHotGames();
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setTogglingHotUid(null);
    }
  };

  const handleDemoLaunch = async (uid: string, name?: string) => {
    try {
      setLaunchingDemoUid(uid);
      const res = await fetch(
        `/api/softapi/catalog?type=demo&game_uid=${encodeURIComponent(uid)}`
      );
      const data = await res.json();
      if (Number(data?.code) === 0 && data?.data?.url) {
        toast.success(`Opening Demo: ${name || uid}`);
        window.open(data.data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(data?.msg || "Demo not available for this game");
      }
    } catch (err: any) {
      toast.error(err?.message || "Demo launch failed");
    } finally {
      setLaunchingDemoUid(null);
    }
  };

  const handleQuickAddHot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUid.trim()) {
      toast.error("Please enter a Game UID");
      return;
    }
    try {
      setAddingQuickHot(true);
      const res = await fetch("/api/games-management/hot-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameUid: quickUid.trim(),
          name: quickName.trim() || undefined,
          category: quickCategory,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Failed to add Hot Game");
        return;
      }
      toast.success(`Added Game #${quickUid.trim()} to Hot Games`);
      setQuickUid("");
      setQuickName("");
      await loadHotGames();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add Hot Game");
    } finally {
      setAddingQuickHot(false);
    }
  };

  const handleUpdateHotGame = async (
    id: string,
    payload: Record<string, any>,
    msg?: string
  ) => {
    try {
      const res = await fetch("/api/games-management/hot-games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Failed to update Hot Game");
        return;
      }
      setHotGames((prev) =>
        prev
          .map((h) => (h.id === id ? { ...h, ...payload } : h))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      if (msg) toast.success(msg);
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    }
  };

  const handleMoveHotGame = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= hotGames.length) return;

    const reordered = [...hotGames];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    const updatedWithOrder = reordered.map((item, i) => ({
      ...item,
      sortOrder: i + 1,
    }));
    setHotGames(updatedWithOrder);

    try {
      await fetch("/api/games-management/hot-games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: updatedWithOrder.map((i) => i.id),
        }),
      });
      toast.success("Hot Games order saved");
    } catch {
      toast.error("Failed to save order");
      loadHotGames();
    }
  };

  const handleDeleteHotGame = async (row: HotGameRow) => {
    if (!window.confirm(`Remove "${row.name}" from Hot Games?`)) return;
    try {
      const res = await fetch("/api/games-management/hot-games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Delete failed");
        return;
      }
      setHotGames((prev) => prev.filter((h) => h.id !== row.id));
      setGames((prev) =>
        prev.map((g) =>
          g.game_uid === row.gameUid ? { ...g, isHot: false } : g
        )
      );
      toast.success("Removed from Hot Games");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  if (loadingProviders && providers.length === 0) {
    return (
      <div className="flex w-full h-[80vh] justify-center items-center">
        <CookieLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-slate-900 to-emerald-950/40 p-6 rounded-xl border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Casino Storefront Control
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Live Sync with Player Site
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-emerald-400" />
            All Providers, Games &amp; Hot Games Manager
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Activate or deactivate SoftAPI game providers, organize categories &amp;
            display order, and curate the Hot Games showcase.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadProviders(true)}
            disabled={syncingProviders}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                syncingProviders ? "animate-spin" : ""
              }`}
            />
            {syncingProviders ? "Syncing..." : "Sync SoftAPI Providers"}
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              Total Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {providers.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              Active Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {activeProviderCount}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              Inactive (Hidden)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              {inactiveProviderCount}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              Curated Hot Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
              <Flame className="w-5 h-5" />
              {hotGames.filter((h) => h.isActive).length}
              <span className="text-xs font-normal text-gray-400">
                / {hotGames.length} total
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-gray-900 border border-gray-800 p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="providers" className="px-4 py-2">
            All Providers ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="games" className="px-4 py-2">
            All Games Catalog
          </TabsTrigger>
          <TabsTrigger value="hot-games" className="px-4 py-2">
            Hot Games Manager ({hotGames.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ALL PROVIDERS */}
        <TabsContent value="providers" className="space-y-4">
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    Game Providers Control
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Inactive providers are automatically hidden from all player
                    tabs, filters, and game lists.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkToggleFiltered(true)}
                    disabled={syncingProviders || filteredProviders.length === 0}
                    className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                  >
                    Enable Filtered ({filteredProviders.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkToggleFiltered(false)}
                    disabled={syncingProviders || filteredProviders.length === 0}
                    className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                  >
                    Disable Filtered ({filteredProviders.length})
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4">
                <div className="md:col-span-5 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <Input
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    placeholder="Search provider name or Brand ID..."
                    className="pl-9 bg-gray-950 border-gray-800"
                  />
                </div>
                <div className="md:col-span-4">
                  <Select
                    value={providerCatFilter}
                    onValueChange={setProviderCatFilter}
                  >
                    <SelectTrigger className="w-full bg-gray-950 border-gray-800">
                      <SelectValue placeholder="Filter Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Select
                    value={providerStatusFilter}
                    onValueChange={setProviderStatusFilter}
                  >
                    <SelectTrigger className="w-full bg-gray-950 border-gray-800">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-md border border-gray-800 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="w-[80px]">Brand #</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="w-[170px]">
                        Primary Category
                      </TableHead>
                      <TableHead className="w-[110px]">Sort Order</TableHead>
                      <TableHead>Games</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviders.map((p) => {
                      const logoBroken = brokenProviderLogos[p.brandId];
                      return (
                        <TableRow
                          key={p.brandId}
                          className={`border-gray-800/80 ${
                            !p.isActive ? "opacity-65 bg-rose-950/10" : ""
                          }`}
                        >
                          <TableCell className="font-mono text-amber-400 font-semibold">
                            #{p.brandId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {!logoBroken && p.logo ? (
                                <img
                                  src={p.logo}
                                  alt={p.displayName}
                                  className="w-12 h-8 object-contain rounded bg-gray-950 p-1 border border-gray-800 shrink-0"
                                  onError={() =>
                                    setBrokenProviderLogos((prev) => ({
                                      ...prev,
                                      [p.brandId]: true,
                                    }))
                                  }
                                />
                              ) : (
                                <div className="w-12 h-8 rounded bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">
                                  {p.brandId}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  {p.displayName}
                                </div>
                                {p.customName && p.customName !== p.name && (
                                  <div className="text-[11px] text-gray-400">
                                    SoftAPI: {p.name}
                                  </div>
                                )}
                                {p.categories?.length > 1 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {p.categories.map((cat) => (
                                      <span
                                        key={cat}
                                        className="text-[10px] px-1.5 rounded bg-gray-800 text-gray-300"
                                      >
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={p.category}
                              onValueChange={(val) =>
                                updateProviderField(
                                  p.brandId,
                                  { category: val },
                                  `${p.displayName} category set to ${val}`
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs bg-gray-950 border-gray-800">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              defaultValue={p.sortOrder}
                              key={`${p.brandId}-${p.sortOrder}`}
                              onBlur={(e) => {
                                const nextOrder = Number(e.target.value);
                                if (
                                  Number.isFinite(nextOrder) &&
                                  nextOrder !== p.sortOrder
                                ) {
                                  updateProviderField(
                                    p.brandId,
                                    { sortOrder: nextOrder },
                                    `Order updated for ${p.displayName}`
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="h-8 w-20 text-xs font-mono bg-gray-950 border-gray-800"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-300">
                                {p.gameCount}
                              </span>
                              {p.currencySupported && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400"
                                >
                                  BDT
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={p.isActive}
                                disabled={updatingBrandId === p.brandId}
                                onCheckedChange={(checked) =>
                                  updateProviderField(
                                    p.brandId,
                                    { isActive: checked },
                                    `${p.displayName} is now ${
                                      checked ? "Active" : "Inactive"
                                    }`
                                  )
                                }
                              />
                              <span
                                className={`text-xs font-semibold ${
                                  p.isActive
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {p.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-gray-700"
                                onClick={() => openEditProviderModal(p)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setSelectedBrandId(p.brandId);
                                  setActiveTab("games");
                                  loadCatalogGames(
                                    0,
                                    p.brandId,
                                    gameSearch,
                                    currencyOnly
                                  );
                                }}
                              >
                                View Games
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredProviders.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10 text-gray-500 text-sm"
                        >
                          No providers match your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ALL GAMES CATALOG */}
        <TabsContent value="games" className="space-y-4">
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Games Explorer</CardTitle>
                  <CardDescription className="text-xs">
                    Browse all SoftAPI games, preview demos, and add or remove
                    games from the Hot Games section.
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/80 px-3 py-1.5 rounded-md border border-gray-700">
                  <Switch
                    id="games-currency-only"
                    checked={currencyOnly}
                    onCheckedChange={(checked) => {
                      setCurrencyOnly(checked);
                      loadCatalogGames(0, selectedBrandId, gameSearch, checked);
                    }}
                  />
                  <Label
                    htmlFor="games-currency-only"
                    className="text-xs text-gray-300 cursor-pointer"
                  >
                    Supported Currency Only
                  </Label>
                </div>
              </div>

              {/* Search & Provider Filter */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4">
                <div className="md:col-span-5">
                  <Label className="text-xs text-gray-400">Provider</Label>
                  <Select
                    value={selectedBrandId}
                    onValueChange={(val) => {
                      setSelectedBrandId(val);
                      loadCatalogGames(0, val, gameSearch, currencyOnly);
                    }}
                  >
                    <SelectTrigger className="w-full bg-gray-950 border-gray-800 mt-1">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map((p) => (
                        <SelectItem key={p.brandId} value={p.brandId}>
                          #{p.brandId} - {p.displayName}{" "}
                          {!p.isActive ? "(Inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-5">
                  <Label className="text-xs text-gray-400">
                    Search Game Name or UID
                  </Label>
                  <Input
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loadCatalogGames(
                          0,
                          selectedBrandId,
                          gameSearch,
                          currencyOnly
                        );
                      }
                    }}
                    placeholder="e.g. Aviator, Super Ace, 737..."
                    className="bg-gray-950 border-gray-800 mt-1"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button
                    onClick={() =>
                      loadCatalogGames(
                        0,
                        selectedBrandId,
                        gameSearch,
                        currencyOnly
                      )
                    }
                    disabled={loadingGames}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loadingGames ? "Loading..." : "Search Games"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingGames ? (
                <div className="py-16 flex justify-center">
                  <CookieLoader />
                </div>
              ) : games.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      Showing {gameOffset + 1} –{" "}
                      {Math.min(gameOffset + games.length, totalGames)} of{" "}
                      {totalGames} games
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={gameOffset === 0}
                        onClick={() =>
                          loadCatalogGames(
                            Math.max(0, gameOffset - 24),
                            selectedBrandId,
                            gameSearch,
                            currencyOnly
                          )
                        }
                        className="border-gray-700 bg-gray-800"
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={gameOffset + 24 >= totalGames}
                        onClick={() =>
                          loadCatalogGames(
                            gameOffset + 24,
                            selectedBrandId,
                            gameSearch,
                            currencyOnly
                          )
                        }
                        className="border-gray-700 bg-gray-800"
                      >
                        Next Page
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {games.map((g) => {
                      const imgBroken = brokenGameImgs[g.game_uid];
                      const thumb =
                        g.logo ||
                        `https://igamingapis.com/img/${g.game_uid}.png`;
                      return (
                        <div
                          key={`${g.game_uid}-${g.brand_id}`}
                          className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all ${
                            g.isHot
                              ? "border-amber-500/60 bg-amber-950/15"
                              : "border-gray-800 bg-gray-950/70"
                          }`}
                        >
                          <div className="p-4 flex items-start gap-3">
                            {!imgBroken && thumb ? (
                              <img
                                src={thumb}
                                alt={g.name}
                                className="w-16 h-16 rounded-lg object-cover bg-gray-800 shrink-0"
                                onError={() =>
                                  setBrokenGameImgs((prev) => ({
                                    ...prev,
                                    [g.game_uid]: true,
                                  }))
                                }
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                                #{g.game_uid}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400 font-mono"
                                >
                                  UID: {g.game_uid}
                                </Badge>
                                {g.isHot && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-black font-bold">
                                    HOT
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-white text-sm truncate mt-1">
                                {g.name}
                              </h4>
                              <p className="text-xs text-gray-400 truncate">
                                {g.provider}{" "}
                                {!g.providerActive && (
                                  <span className="text-rose-400">
                                    (Disabled)
                                  </span>
                                )}
                              </p>
                              {g.category && (
                                <span className="text-[11px] text-gray-500">
                                  {g.category}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="px-4 pb-3 pt-2 border-t border-gray-800/80 flex items-center justify-between gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={launchingDemoUid === g.game_uid}
                              onClick={() =>
                                handleDemoLaunch(g.game_uid, g.name)
                              }
                              className="h-8 px-2.5 text-xs border-gray-700"
                            >
                              {launchingDemoUid === g.game_uid
                                ? "Opening..."
                                : "Demo"}
                            </Button>

                            <Button
                              size="sm"
                              disabled={togglingHotUid === g.game_uid}
                              onClick={() => handleToggleGameHot(g)}
                              className={`h-8 px-3 text-xs font-semibold flex-1 ${
                                g.isHot
                                  ? "bg-amber-500 hover:bg-amber-600 text-black"
                                  : "bg-gray-800 hover:bg-emerald-600 text-white"
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5 mr-1" />
                              {g.isHot ? "Hot (Remove)" : "+ Add to Hot"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No games found. Try selecting a provider or searching by game
                  name / UID.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: HOT GAMES MANAGER */}
        <TabsContent value="hot-games" className="space-y-4">
          {/* Quick Add by UID */}
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Quick Add Game to Hot Games
              </CardTitle>
              <CardDescription className="text-xs">
                Enter a SoftAPI Game UID directly (we automatically fetch name
                and thumbnail from SoftAPI if left blank) or browse the All
                Games Catalog tab and click &ldquo;+ Add to Hot&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleQuickAddHot}
                className="grid grid-cols-1 md:grid-cols-12 gap-3"
              >
                <div className="md:col-span-3">
                  <Label className="text-xs text-gray-400">Game UID *</Label>
                  <Input
                    required
                    value={quickUid}
                    onChange={(e) => setQuickUid(e.target.value)}
                    placeholder="e.g. 737"
                    className="bg-gray-950 border-gray-800 mt-1 font-mono"
                  />
                </div>
                <div className="md:col-span-4">
                  <Label className="text-xs text-gray-400">
                    Game Name (Optional auto-lookup)
                  </Label>
                  <Input
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="e.g. Aviator"
                    className="bg-gray-950 border-gray-800 mt-1"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs text-gray-400">Category</Label>
                  <Select
                    value={quickCategory}
                    onValueChange={setQuickCategory}
                  >
                    <SelectTrigger className="w-full bg-gray-950 border-gray-800 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button
                    type="submit"
                    disabled={addingQuickHot}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    {addingQuickHot ? "Adding..." : "+ Add Hot"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Hot Games Ordered List */}
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Curated Hot Games List</CardTitle>
              <CardDescription className="text-xs">
                Players see active Hot Games on the Home screen and /hot page in
                the exact order listed here. Games whose provider is disabled
                are automatically hidden from players.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHot ? (
                <div className="py-10 flex justify-center">
                  <CookieLoader />
                </div>
              ) : (
                <div className="rounded-md border border-gray-800 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="w-[120px]">Order</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="w-[150px]">Category</TableHead>
                        <TableHead className="w-[130px]">Visible</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hotGames.map((hg, idx) => (
                        <TableRow
                          key={hg.id}
                          className={`border-gray-800/80 ${
                            !hg.isActive || hg.providerActive === false
                              ? "opacity-65"
                              : ""
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                disabled={idx === 0}
                                onClick={() => handleMoveHotGame(idx, -1)}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                disabled={idx === hotGames.length - 1}
                                onClick={() => handleMoveHotGame(idx, 1)}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                              <span className="font-mono text-xs text-gray-400 ml-1">
                                #{idx + 1}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {hg.img ? (
                                <img
                                  src={hg.img}
                                  alt={hg.name}
                                  className="w-11 h-11 rounded-md object-cover bg-gray-800 shrink-0"
                                  onError={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : null}
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  {hg.name}
                                </div>
                                <div className="text-xs font-mono text-amber-400">
                                  UID: {hg.gameUid}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-gray-300">
                                {hg.providerDisplayName ||
                                  hg.providerName ||
                                  `Brand #${hg.brandId}`}
                              </span>
                              {hg.providerActive === false && (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-[10px] border-rose-500/40 text-rose-400"
                                >
                                  Provider Disabled
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={hg.category}
                              onValueChange={(val) =>
                                handleUpdateHotGame(
                                  hg.id,
                                  { category: val },
                                  "Category updated"
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs bg-gray-950 border-gray-800">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={hg.isActive}
                                onCheckedChange={(checked) =>
                                  handleUpdateHotGame(
                                    hg.id,
                                    { isActive: checked },
                                    `${hg.name} is now ${
                                      checked ? "Visible" : "Hidden"
                                    }`
                                  )
                                }
                              />
                              <span
                                className={`text-xs ${
                                  hg.isActive
                                    ? "text-emerald-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {hg.isActive ? "Active" : "Hidden"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => handleDeleteHotGame(hg)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {hotGames.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-10 text-gray-500 text-sm"
                          >
                            No Hot Games added yet. Use Quick Add above or pick
                            from All Games Catalog!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Provider Dialog */}
      <Dialog
        open={Boolean(editingProvider)}
        onOpenChange={(open) => !open && setEditingProvider(null)}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Edit Provider #{editingProvider?.brandId} ({editingProvider?.name}
              )
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Customize player-facing display name, logo, categories, and sort
              order.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProviderEdit} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Custom Display Name (Optional)</Label>
              <Input
                value={editCustomName}
                onChange={(e) => setEditCustomName(e.target.value)}
                placeholder={editingProvider?.name}
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Logo URL</Label>
              <Input
                value={editLogo}
                onChange={(e) => setEditLogo(e.target.value)}
                placeholder="https://..."
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Primary Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-full bg-gray-950 border-gray-800 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="bg-gray-950 border-gray-800 mt-1 font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">
                Show in Additional Tabs
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((c) => {
                  const selected =
                    c.value === editCategory ||
                    editCategories.includes(c.value);
                  return (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => {
                        if (c.value === editCategory) return;
                        setEditCategories((prev) =>
                          prev.includes(c.value)
                            ? prev.filter((item) => item !== c.value)
                            : [...prev, c.value]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                        selected
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-gray-950 border-gray-800 text-gray-400"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProvider(null)}
                className="border-gray-700 bg-gray-800 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingProviderEdit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {savingProviderEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

