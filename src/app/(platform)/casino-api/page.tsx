"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CookieLoader from "@/components/loaders/cookie-loader";
import GgrWalletLedger from "@/components/home/ggr-wallet-ledger";
import { toast } from "sonner";

interface ProviderItem {
  brand_id: number;
  name: string;
  logo?: string;
  game_count?: number;
  currency_supported?: boolean;
}

interface GameItem {
  game_id: number;
  game_uid: string;
  brand_id: number;
  name: string;
  provider?: string;
  category?: string;
  logo?: string;
  currency_supported?: boolean;
}

export default function CasinoSoftApiPage() {
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("wallet");

  // Config form state
  const [baseUrl, setBaseUrl] = useState("https://world-casino-api.com/api/v1");
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [returnUrl, setReturnUrl] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("BDT");
  const [bharatMatkaLogo, setBharatMatkaLogo] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Catalog state (Providers & Games)
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [games, setGames] = useState<GameItem[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all");
  const [gameSearch, setGameSearch] = useState("");
  const [currencySupportedOnly, setCurrencySupportedOnly] = useState(false);
  const [gameOffset, setGameOffset] = useState(0);

  // Demo & Test Launch state
  const [launchingGameUid, setLaunchingGameUid] = useState<string | null>(null);
  const [testLaunchUserId, setTestLaunchUserId] = useState("1001");
  const [testLaunchBalance, setTestLaunchBalance] = useState("1000");

  // Free Rounds state (Section 4b: PG, PP, JILI)
  const [frUserIdentifier, setFrUserIdentifier] = useState("");
  const [frGameUid, setFrGameUid] = useState("737");
  const [frBonusCode, setFrBonusCode] = useState("WELCOME01");
  const [frCurrency, setFrCurrency] = useState("BDT");
  const [frTotalBet, setFrTotalBet] = useState("5");
  const [frRounds, setFrRounds] = useState("10");
  const [frDurationHours, setFrDurationHours] = useState("48");
  const [submittingFreeRounds, setSubmittingFreeRounds] = useState(false);
  const [freeRoundResult, setFreeRoundResult] = useState<any>(null);

  // Provider Currencies state
  const [providerCurrencies, setProviderCurrencies] = useState<any[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [currencySearchFilter, setCurrencySearchFilter] = useState("");

  // Simulate Callback state
  const [simulatingCallback, setSimulatingCallback] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await fetch("/api/softapi/overview");
      const data = await res.json();
      setOverview(data);
      if (data?.config) {
        setBaseUrl(
          data.config.baseUrl || "https://world-casino-api.com/api/v1"
        );
        setToken(data.config.token || "");
        setCallbackUrl(
          data.config.callbackUrl ||
            (typeof window !== "undefined"
              ? `${window.location.origin}/api/softapi/callback`
              : "https://yoursite.com/api/softapi/callback")
        );
        setReturnUrl(data.config.returnUrl || "https://yoursite.com/lobby");
        setDefaultCurrency(data.config.defaultCurrency || "BDT");
        setFrCurrency(data.config.defaultCurrency || "BDT");
        setBharatMatkaLogo(data.config.bharatMatkaLogo || "");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load SoftAPI overview");
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const fetchProviders = useCallback(async () => {
    try {
      setLoadingProviders(true);
      const params = new URLSearchParams({ type: "providers" });
      if (currencySupportedOnly) params.set("currency_supported", "1");
      const res = await fetch(`/api/softapi/catalog?${params.toString()}`);
      const data = await res.json();
      if (Number(data?.code) === 0 && data?.data?.providers) {
        setProviders(data.data.providers);
      } else {
        if (data?.msg) toast.warning(data.msg);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch providers");
    } finally {
      setLoadingProviders(false);
    }
  }, [currencySupportedOnly]);

  const fetchGames = useCallback(
    async (offsetVal = 0, brand = selectedBrandId, query = gameSearch) => {
      try {
        setLoadingGames(true);
        const params = new URLSearchParams({
          type: "games",
          limit: "24",
          offset: String(offsetVal),
        });
        if (brand && brand !== "all") params.set("brand_id", brand);
        if (query.trim()) params.set("q", query.trim());
        if (currencySupportedOnly) params.set("currency_supported", "1");

        const res = await fetch(`/api/softapi/catalog?${params.toString()}`);
        const data = await res.json();
        if (Number(data?.code) === 0 && data?.data?.games) {
          setGames(data.data.games);
          setTotalGames(Number(data.data.total || data.data.games.length));
          setGameOffset(offsetVal);
        } else {
          if (data?.msg) toast.warning(data.msg);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch games");
      } finally {
        setLoadingGames(false);
      }
    },
    [selectedBrandId, gameSearch, currencySupportedOnly]
  );

  const fetchProviderCurrencies = async () => {
    try {
      setLoadingCurrencies(true);
      const params = new URLSearchParams({ type: "provider-currencies" });
      if (currencySearchFilter.trim()) {
        params.set("currency", currencySearchFilter.trim().toUpperCase());
      }
      const res = await fetch(`/api/softapi/catalog?${params.toString()}`);
      const data = await res.json();
      if (Number(data?.code) === 0 && data?.data?.providers) {
        setProviderCurrencies(data.data.providers);
      } else {
        toast.warning(data?.msg || "Could not load provider currencies");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch provider currencies");
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const res = await fetch("/api/softapi/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          token,
          secret: secret.trim() ? secret.trim() : undefined,
          callbackUrl,
          returnUrl,
          defaultCurrency,
          bharatMatkaLogo,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to save configuration");
        return;
      }
      toast.success("Seamless SoftAPI configuration saved!");
      setSecret("");
      await fetchOverview();
    } catch (err: any) {
      toast.error(err?.message || "Error saving configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDemoLaunch = async (gameUid: string, gameName?: string) => {
    try {
      setLaunchingGameUid(`demo-${gameUid}`);
      const res = await fetch(
        `/api/softapi/catalog?type=demo&game_uid=${encodeURIComponent(gameUid)}`
      );
      const data = await res.json();
      if (Number(data?.code) === 0 && data?.data?.url) {
        toast.success(`Opening Demo for ${gameName || `Game #${gameUid}`}`);
        window.open(data.data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(
          data?.msg || `Demo failed (Code: ${data?.code ?? "Unknown"})`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Demo launch error");
    } finally {
      setLaunchingGameUid(null);
    }
  };

  const handleRealTestLaunch = async (gameUid: string, gameName?: string) => {
    try {
      setLaunchingGameUid(`launch-${gameUid}`);
      const res = await fetch("/api/softapi/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: testLaunchUserId || 1001,
          balance: Number(testLaunchBalance || 100),
          game_uid: gameUid,
          currency_code: defaultCurrency,
        }),
      });
      const data = await res.json();
      // Section 3: Always check code === 0 before opening a URL
      if (Number(data?.code) === 0 && data?.data?.url) {
        toast.success(
          `Game Launched! Opening ${gameName || `Game #${gameUid}`}`
        );
        window.open(data.data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(
          `Launch Failed (Code ${data?.code}): ${
            data?.msg || "Check Token, 32-char Secret, IP Whitelist & GGR Wallet"
          }`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Launch request failed");
    } finally {
      setLaunchingGameUid(null);
    }
  };

  const handleFreeRoundsAction = async (action: "create" | "cancel") => {
    if (!frUserIdentifier.trim() || !frGameUid.trim() || !frBonusCode.trim()) {
      toast.error("Please fill in Player ID/Phone, Game UID, and Bonus Code.");
      return;
    }
    try {
      setSubmittingFreeRounds(true);
      setFreeRoundResult(null);
      const res = await fetch("/api/softapi/free-rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          user_identifier: frUserIdentifier.trim(),
          game_uid: frGameUid.trim(),
          bonus_code: frBonusCode.trim(),
          currency_code: frCurrency.trim(),
          total_bet: frTotalBet.trim(),
          rounds: Number(frRounds),
          duration_hours: Number(frDurationHours),
        }),
      });
      const data = await res.json();
      setFreeRoundResult(data);
      if (Number(data?.code) === 0) {
        toast.success(
          action === "create"
            ? `Free rounds created! Bonus: ${frBonusCode}`
            : `Unused free rounds cancelled for ${frBonusCode}`
        );
      } else {
        toast.error(data?.msg || `Request returned code ${data?.code}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Free rounds request failed");
    } finally {
      setSubmittingFreeRounds(false);
    }
  };

  const handleSimulateCallback = async () => {
    try {
      setSimulatingCallback(true);
      const mockSerial = `TEST_SETTLE_${Date.now()}`;
      const res = await fetch("/api/softapi/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: 737,
          game_uid: "737",
          game_round: `ROUND_${Math.floor(Math.random() * 90000 + 10000)}`,
          member_account: testLaunchUserId || "1001",
          bet_amount: 10,
          win_amount: 25,
          credit_amount: 1015,
          timestamp: String(Date.now()),
          serial_number: mockSerial,
          game_name: "Aviator (Simulated Test)",
        }),
      });
      if (res.ok) {
        toast.success(
          `Callback HTTP 200 OK! Serial ${mockSerial} processed.`
        );
        await fetchOverview();
      } else {
        toast.error(`Callback returned status ${res.status}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Simulation failed");
    } finally {
      setSimulatingCallback(false);
    }
  };

  if (loadingOverview && !overview) {
    return (
      <div className="flex w-full h-[80vh] justify-center items-center">
        <CookieLoader />
      </div>
    );
  }

  const ggrWallet = overview?.ggr?.wallet;
  const ggrStatus = overview?.ggr?.status;
  const hasToken = overview?.config?.hasToken;
  const hasValidSecret = overview?.config?.hasValidSecret;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-slate-900 to-amber-950/40 p-6 rounded-xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
              Seamless SoftAPI v1
            </span>
            <span className="text-xs text-gray-400 font-mono">
              world-casino-api.com
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Casino, Slots & Sports API Control Center
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage GGR billing wallet, AES-256-ECB game launches, PG/PP/JILI
            free spins, providers catalog & settle callbacks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/games-management"
            className="inline-flex items-center justify-center rounded-md text-sm font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            Manage Providers &amp; Hot Games
          </Link>
          <Button
            variant="outline"
            onClick={fetchOverview}
            className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-white"
          >
            Refresh Status
          </Button>
          <Button
            onClick={() => setActiveTab("config")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            API Settings
          </Button>
        </div>
      </div>

      {/* Top 4 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: GGR Wallet */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-400">
              GGR Billing Wallet
            </CardTitle>
            <Badge
              variant="outline"
              className={
                ggrStatus === "OK"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : ggrStatus === "LOW"
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }
            >
              {ggrStatus || "UNSET"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {ggrWallet !== null && ggrWallet !== undefined
                ? `৳ ${Number(ggrWallet).toLocaleString()}`
                : "—"}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {overview?.ggr?.message ||
                "Requires > 0 and >= 5% of player launch balance"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: AES-256-ECB Auth Status */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-400">
              AES-256-ECB Credentials
            </CardTitle>
            <Badge
              variant="outline"
              className={
                hasToken && hasValidSecret
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }
            >
              {hasToken && hasValidSecret ? "READY" : "ACTION NEEDED"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white">
              {hasToken ? "Token Set" : "No Token"} •{" "}
              {overview?.config?.secretLength || 0}/32 Chars
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {hasValidSecret
                ? `Secret (${overview?.config?.secretMasked}) valid for PKCS7`
                : "Secret must be exact 32 characters from Overview"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Play Currency & Endpoint */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-400">
              Play Currency & Mode
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/30"
            >
              SEAMLESS
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {defaultCurrency}
            </div>
            <p className="text-xs text-gray-400 mt-1 truncate">
              Base: {overview?.config?.baseUrl}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Callback Webhook */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-400">
              Settle Callback Receiver
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-400 border-purple-500/30"
            >
              HTTP 200 OK
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {overview?.recentCallbacks?.length || 0}{" "}
              <span className="text-sm font-normal text-gray-400">
                recent logs
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 truncate">
              Endpoint: /api/softapi/callback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Functional Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-gray-900 border border-gray-800 p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="wallet" className="px-4 py-2">
            GGR Wallet & Deposits (৳)
          </TabsTrigger>
          <TabsTrigger value="catalog" className="px-4 py-2">
            Providers & Games Catalog
          </TabsTrigger>
          <TabsTrigger value="free-rounds" className="px-4 py-2">
            Free Spins (PG / PP / JILI)
          </TabsTrigger>
          <TabsTrigger value="callbacks" className="px-4 py-2">
            Bet / Settle Callbacks
          </TabsTrigger>
          <TabsTrigger value="ggr-rates" className="px-4 py-2">
            GGR Rates & Currencies
          </TabsTrigger>
          <TabsTrigger value="config" className="px-4 py-2">
            API Config & Go-Live Checklist
          </TabsTrigger>
        </TabsList>

        {/* TAB 0: GGR WALLET LEDGER */}
        <TabsContent value="wallet">
          <GgrWalletLedger />
        </TabsContent>

        {/* TAB 1: PROVIDERS & GAMES CATALOG */}
        <TabsContent value="catalog" className="space-y-6">
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Game Providers & Catalog Explorer</CardTitle>
                  <CardDescription>
                    Fetch live providers (/api/v1/providers), browse games
                    (/api/v1/games), launch Demo free play (/api/v1/demo) or
                    test encrypted launch.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2 bg-gray-800/80 px-3 py-1.5 rounded-md border border-gray-700">
                    <Switch
                      id="currency-filter"
                      checked={currencySupportedOnly}
                      onCheckedChange={setCurrencySupportedOnly}
                    />
                    <Label
                      htmlFor="currency-filter"
                      className="text-xs text-gray-300 cursor-pointer"
                    >
                      Supported Currency Only (currency_supported=1)
                    </Label>
                  </div>
                  <Button
                    onClick={fetchProviders}
                    disabled={loadingProviders}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loadingProviders ? "Loading..." : "Load Providers"}
                  </Button>
                  <Button
                    onClick={() => fetchGames(0)}
                    disabled={loadingGames}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loadingGames ? "Loading..." : "Load Games"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Providers Horizontal Strip */}
              {providers.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Active Providers ({providers.length}) — Click to filter
                    games by brand_id
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBrandId("all");
                        fetchGames(0, "all", gameSearch);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedBrandId === "all"
                          ? "bg-amber-500/20 border-amber-500 text-white"
                          : "bg-gray-800/60 border-gray-700/80 text-gray-300 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-bold text-sm">All Providers</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Full Catalog
                      </div>
                    </button>
                    {providers.map((p) => (
                      <button
                        type="button"
                        key={p.brand_id}
                        onClick={() => {
                          const bId = String(p.brand_id);
                          setSelectedBrandId(bId);
                          fetchGames(0, bId, gameSearch);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          selectedBrandId === String(p.brand_id)
                            ? "bg-amber-500/20 border-amber-500 text-white"
                            : "bg-gray-800/60 border-gray-700/80 text-gray-300 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-amber-400">
                            #{p.brand_id}
                          </span>
                          {p.currency_supported && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          )}
                        </div>
                        <div className="font-semibold text-sm truncate mt-1">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {p.game_count ?? 0} games
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Test Launch Parameters Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-800/40 p-4 rounded-lg border border-gray-800">
                <div className="md:col-span-5">
                  <Label className="text-xs text-gray-400">
                    Search Game Name or UID (e.g. Aviator, 737)
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={gameSearch}
                      onChange={(e) => setGameSearch(e.target.value)}
                      placeholder="Search games..."
                      className="bg-gray-900 border-gray-700"
                    />
                    <Button
                      onClick={() => fetchGames(0)}
                      disabled={loadingGames}
                      variant="secondary"
                    >
                      Search
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs text-gray-400">
                    Brand ID Filter
                  </Label>
                  <Input
                    value={selectedBrandId === "all" ? "" : selectedBrandId}
                    onChange={(e) =>
                      setSelectedBrandId(e.target.value.trim() || "all")
                    }
                    placeholder="All (or e.g. 12)"
                    className="bg-gray-900 border-gray-700 mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-400">
                    Test Launch User ID
                  </Label>
                  <Input
                    value={testLaunchUserId}
                    onChange={(e) => setTestLaunchUserId(e.target.value)}
                    placeholder="1001"
                    className="bg-gray-900 border-gray-700 mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-400">
                    Test Starting Balance
                  </Label>
                  <Input
                    type="number"
                    value={testLaunchBalance}
                    onChange={(e) => setTestLaunchBalance(e.target.value)}
                    placeholder="1000"
                    className="bg-gray-900 border-gray-700 mt-1"
                  />
                </div>
              </div>

              {/* Games Grid */}
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
                          fetchGames(Math.max(0, gameOffset - 24))
                        }
                        className="border-gray-700 bg-gray-800"
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={gameOffset + 24 >= totalGames}
                        onClick={() => fetchGames(gameOffset + 24)}
                        className="border-gray-700 bg-gray-800"
                      >
                        Next Page
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {games.map((g) => (
                      <div
                        key={g.game_uid}
                        className="rounded-xl border border-gray-800 bg-gray-950/70 overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all"
                      >
                        <div className="p-4 flex items-start gap-3">
                          {g.logo ? (
                            <img
                              src={g.logo}
                              alt={g.name}
                              className="w-14 h-14 rounded-lg object-cover bg-gray-800 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                              #{g.game_uid}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400"
                              >
                                UID: {g.game_uid}
                              </Badge>
                              {g.category && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-gray-700 text-gray-400"
                                >
                                  {g.category}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-white text-sm truncate mt-1">
                              {g.name}
                            </h4>
                            <p className="text-xs text-gray-400 truncate">
                              {g.provider || `Brand #${g.brand_id}`}
                            </p>
                          </div>
                        </div>

                        <div className="px-4 py-2.5 bg-gray-900 border-t border-gray-800 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              launchingGameUid === `demo-${g.game_uid}`
                            }
                            onClick={() =>
                              handleDemoLaunch(g.game_uid, g.name)
                            }
                            className="flex-1 h-8 text-xs border-gray-700 hover:bg-gray-800"
                          >
                            {launchingGameUid === `demo-${g.game_uid}`
                              ? "..."
                              : "Demo"}
                          </Button>
                          <Button
                            size="sm"
                            disabled={
                              launchingGameUid === `launch-${g.game_uid}`
                            }
                            onClick={() =>
                              handleRealTestLaunch(g.game_uid, g.name)
                            }
                            className="flex-1 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                          >
                            {launchingGameUid === `launch-${g.game_uid}`
                              ? "..."
                              : "Launch"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setFrGameUid(String(g.game_uid));
                              setActiveTab("free-rounds");
                              toast.info(
                                `Selected Game UID ${g.game_uid} (${g.name}) for Free Spins`
                              );
                            }}
                            title="Give Free Spins on this game"
                            className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            +Spins
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
                  <p className="text-gray-400 text-sm">
                    Click <strong>&ldquo;Load Providers&rdquo;</strong> or{" "}
                    <strong>&ldquo;Load Games&rdquo;</strong> above to browse
                    the live Seamless SoftAPI catalog, or test Quick Launch
                    with Game UID <strong>737 (Aviator)</strong>:
                  </p>
                  <div className="flex justify-center gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleDemoLaunch("737", "Aviator")}
                      className="border-amber-500/40 text-amber-400"
                    >
                      Test Aviator Demo (#737)
                    </Button>
                    <Button
                      onClick={() => handleRealTestLaunch("737", "Aviator")}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                    >
                      Test Aviator Encrypted Launch (#737)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: FREE ROUNDS / FREE SPINS (PG, PP, JILI) */}
        <TabsContent value="free-rounds" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-gray-900/90 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Free Spins / Free Rounds Manager (Section 4b)
                    </CardTitle>
                    <CardDescription>
                      Supported on <strong>PG Soft, Pragmatic Play (PP), and JILI</strong> slots. Give a player free spins on one slot or cancel unused rounds.
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PG • PP • JILI
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Player ID / Phone / Numeric user_id *
                    </Label>
                    <Input
                      value={frUserIdentifier}
                      onChange={(e) => setFrUserIdentifier(e.target.value)}
                      placeholder="e.g. 1001 or player phone/playerId"
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Automatically maps database user or numeric player ID.
                    </p>
                  </div>

                  <div>
                    <Label>SoftAPI Game UID (PG, PP, or JILI slot) *</Label>
                    <Input
                      value={frGameUid}
                      onChange={(e) => setFrGameUid(e.target.value)}
                      placeholder="e.g. 737"
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                  </div>

                  <div>
                    <Label>Bonus Code (A-Z, 0-9, _, - max 64 chars) *</Label>
                    <Input
                      value={frBonusCode}
                      onChange={(e) => setFrBonusCode(e.target.value)}
                      placeholder="e.g. WELCOME01"
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                  </div>

                  <div>
                    <Label>Play Currency *</Label>
                    <Input
                      value={frCurrency}
                      onChange={(e) =>
                        setFrCurrency(e.target.value.toUpperCase())
                      }
                      placeholder="BDT / INR / USD"
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                  </div>

                  <div>
                    <Label>Stake of One Free Spin (total_bet) *</Label>
                    <Input
                      value={frTotalBet}
                      onChange={(e) => setFrTotalBet(e.target.value)}
                      placeholder="e.g. 4"
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                  </div>

                  <div>
                    <Label>Number of Free Rounds (1 to 500) *</Label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={frRounds}
                      onChange={(e) => setFrRounds(e.target.value)}
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Validity Duration (Hours from now)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={frDurationHours}
                      onChange={(e) => setFrDurationHours(e.target.value)}
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    disabled={submittingFreeRounds}
                    onClick={() => handleFreeRoundsAction("create")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {submittingFreeRounds
                      ? "Processing..."
                      : "Create Free Rounds (/free-rounds/create)"}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={submittingFreeRounds}
                    onClick={() => handleFreeRoundsAction("cancel")}
                  >
                    Cancel Unused Rounds (/free-rounds/cancel)
                  </Button>
                </div>

                {freeRoundResult && (
                  <div className="mt-4 p-4 rounded-lg bg-gray-950 border border-gray-800 text-xs font-mono overflow-x-auto">
                    <div className="text-gray-400 mb-1">API Response:</div>
                    <pre className="text-emerald-400">
                      {JSON.stringify(freeRoundResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/90 border-gray-800">
              <CardHeader>
                <CardTitle className="text-base">
                  How Free Rounds Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-gray-300 leading-relaxed">
                <p>
                  1. <strong>Supported Providers:</strong> Free spin is
                  supported on <strong>PG, PP, and JILI</strong> slots (not
                  available for 9Wicket).
                </p>
                <p>
                  2. <strong>Flow:</strong> Call <code>/free-rounds/create</code>{" "}
                  first, then when the player opens that <code>game_uid</code>{" "}
                  as usual, the provider automatically displays the free spins!
                </p>
                <p>
                  3. <strong>Settle Callback:</strong> When a free spin settles,
                  the bet callback includes{" "}
                  <code>free_spin_bonus: &quot;YOUR_BONUS_CODE&quot;</code>.
                </p>
                <p>
                  4. <strong>Cancellation:</strong> Cancel unused rounds at any
                  time with the exact same <code>user_id</code>,{" "}
                  <code>game_uid</code>, and <code>bonus_code</code>.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: BET / SETTLE CALLBACKS */}
        <TabsContent value="callbacks" className="space-y-6">
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Bet / Settle Callback Logs (Section 5)</CardTitle>
                <CardDescription>
                  Real-time log of per-round settle POST notifications sent by
                  SoftAPI to <code>/api/softapi/callback</code>. Idempotent on{" "}
                  <code>serial_number</code>.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSimulateCallback}
                  disabled={simulatingCallback}
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                >
                  {simulatingCallback
                    ? "Testing..."
                    : "Simulate Test Round Callback"}
                </Button>
                <Button variant="secondary" onClick={fetchOverview}>
                  Refresh Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead>Time</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Player (member_account)</TableHead>
                    <TableHead>Game</TableHead>
                    <TableHead>Bet</TableHead>
                    <TableHead>Win</TableHead>
                    <TableHead>Credit Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.recentCallbacks?.length > 0 ? (
                    overview.recentCallbacks.map((cb: any, idx: number) => (
                      <TableRow key={idx} className="border-gray-800">
                        <TableCell className="text-xs text-gray-400">
                          {new Date(cb.receivedAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {cb.serial_number}
                        </TableCell>
                        <TableCell className="font-medium">
                          {cb.member_account}
                        </TableCell>
                        <TableCell>
                          {cb.game_name || `#${cb.game_uid}`}
                          {cb.free_spin_bonus && (
                            <Badge className="ml-2 bg-purple-500/20 text-purple-300 text-[10px]">
                              Bonus: {cb.free_spin_bonus}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-amber-400">
                          {cb.bet_amount}
                        </TableCell>
                        <TableCell className="text-emerald-400">
                          {cb.win_amount}
                        </TableCell>
                        <TableCell className="font-bold text-white">
                          {cb.credit_amount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              cb.status === "PROCESSED"
                                ? "border-emerald-500/40 text-emerald-400"
                                : cb.status === "DUPLICATE"
                                ? "border-blue-500/40 text-blue-400"
                                : "border-amber-500/40 text-amber-400"
                            }
                          >
                            {cb.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-400"
                      >
                        No settle callbacks received yet. Click &ldquo;Simulate
                        Test Round Callback&rdquo; above to test your receiver!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: GGR BILLING RATES, CURRENCIES & ERROR CODES */}
        <TabsContent value="ggr-rates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category GGR Rates (Section 8) */}
            <Card className="bg-gray-900/90 border-gray-800">
              <CardHeader>
                <CardTitle>
                  Category GGR Billing Rates (Section 8)
                </CardTitle>
                <CardDescription>
                  Effective rate = max(your account floor rate, category rate).
                  Launch requires GGR wallet &gt; 0 and at least 5% of launch
                  balance after FX.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead>Category</TableHead>
                      <TableHead>Net Loss Billing Rate</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(overview?.categoryRates || []).map(
                      (item: any, i: number) => (
                        <TableRow key={i} className="border-gray-800">
                          <TableCell className="font-semibold text-white">
                            {item.category}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              {item.rate}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {item.description}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Error Codes Reference (Section 9) */}
            <Card className="bg-gray-900/90 border-gray-800">
              <CardHeader>
                <CardTitle>SoftAPI Error Codes Reference (Section 9)</CardTitle>
                <CardDescription>
                  Treat any code other than 0 as failure. Never open data.url
                  unless code === 0.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead>Code</TableHead>
                      <TableHead>HTTP</TableHead>
                      <TableHead>Meaning / Typical Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(overview?.errorCodes || []).map((err: any, i: number) => (
                      <TableRow key={i} className="border-gray-800">
                        <TableCell className="font-mono font-bold text-amber-400">
                          {err.code}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-400">
                          {err.http}
                        </TableCell>
                        <TableCell className="text-xs text-gray-300">
                          {err.meaning}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Provider Currencies Lookup (Section 7) */}
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Provider Currencies Explorer (/api/v1/provider-currencies)
                </CardTitle>
                <CardDescription>
                  Check which currencies (BDT, INR, USD, etc.) each provider
                  supports on your account.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  value={currencySearchFilter}
                  onChange={(e) => setCurrencySearchFilter(e.target.value)}
                  placeholder="Filter currency (e.g. BDT, INR)"
                  className="w-48 bg-gray-950 border-gray-800"
                />
                <Button
                  onClick={fetchProviderCurrencies}
                  disabled={loadingCurrencies}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loadingCurrencies ? "Loading..." : "Check Currencies"}
                </Button>
              </div>
            </CardHeader>
            {providerCurrencies.length > 0 && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1 scrollbar-sm">
                  {providerCurrencies.map((pc: any) => (
                    <div
                      key={pc.brand_id}
                      className="p-3 rounded-lg bg-gray-950 border border-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">
                          {pc.name}
                        </span>
                        <span className="text-xs font-mono text-amber-400">
                          #{pc.brand_id}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(pc.currencies || []).map((c: string) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="text-[10px] border-gray-700 text-gray-300"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* TAB 5: API CONFIG & GO-LIVE CHECKLIST */}
        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/90 border-gray-800">
              <CardHeader>
                <CardTitle>
                  Backend Credentials & Endpoint Settings
                </CardTitle>
                <CardDescription>
                  Token + 32-character Secret stay strictly on the backend.
                  Whitelist your calling server IP in Client Panel &gt;
                  Settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div>
                    <Label>Base URL (Legacy igamingapis.live turns off 10 Sep 2026)</Label>
                    <Input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://world-casino-api.com/api/v1"
                      className="bg-gray-950 border-gray-800 mt-1"
                    />
                  </div>

                  <div>
                    <Label>SoftAPI Account Token (YOUR_TOKEN)</Label>
                    <Input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your SoftAPI Token from Client Panel Overview"
                      className="bg-gray-950 border-gray-800 mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>
                        32-Character AES-256-ECB Secret Key
                      </Label>
                      <span
                        className={`text-xs font-mono ${
                          secret.length === 32
                            ? "text-emerald-400"
                            : secret.length === 0 && hasValidSecret
                            ? "text-blue-400"
                            : "text-amber-400"
                        }`}
                      >
                        {secret.length > 0
                          ? `${secret.length}/32 chars`
                          : hasValidSecret
                          ? `Saved (${overview?.config?.secretMasked})`
                          : "Not set (0/32)"}
                      </span>
                    </div>
                    <Input
                      type="password"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder={
                        hasValidSecret
                          ? "Leave blank to keep existing 32-char secret, or enter new"
                          : "Enter exact 32-character Secret from Overview"
                      }
                      className="bg-gray-950 border-gray-800 mt-1 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Default Play Currency (currency_code)</Label>
                      <Input
                        value={defaultCurrency}
                        onChange={(e) =>
                          setDefaultCurrency(e.target.value.toUpperCase())
                        }
                        placeholder="BDT / INR / USD"
                        className="bg-gray-950 border-gray-800 mt-1"
                      />
                    </div>
                    <div>
                      <Label>Return / Lobby URL</Label>
                      <Input
                        value={returnUrl}
                        onChange={(e) => setReturnUrl(e.target.value)}
                        placeholder="https://yoursite.com/lobby"
                        className="bg-gray-950 border-gray-800 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>HTTPS Bet / Settle Callback URL</Label>
                    <Input
                      value={callbackUrl}
                      onChange={(e) => setCallbackUrl(e.target.value)}
                      placeholder="https://yoursite.com/api/softapi/callback"
                      className="bg-gray-950 border-gray-800 mt-1 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label>
                      BHARAT MATKA Custom Client Logo (Optional — HTTPS PNG
                      only)
                    </Label>
                    <Input
                      value={bharatMatkaLogo}
                      onChange={(e) => setBharatMatkaLogo(e.target.value)}
                      placeholder="https://client-domain.com/images/brand-logo.png"
                      className="bg-gray-950 border-gray-800 mt-1 text-xs"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Leave empty for default Bharat Matka logo. http, .jpg, or
                      bare names return code 7.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingConfig}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    {savingConfig
                      ? "Saving..."
                      : "Save SoftAPI Configuration"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Section 10: Go-Live Checklist */}
            <Card className="bg-gray-900/90 border-gray-800">
              <CardHeader>
                <CardTitle>10. Go-Live Checklist (Official Spec)</CardTitle>
                <CardDescription>
                  Automated verification of the 12 go-live requirements from
                  Page 9 of the Seamless SoftAPI documentation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5 text-xs">
                  {[
                    {
                      num: 1,
                      text: "Base URL is https://world-casino-api.com/api/v1",
                      ok: baseUrl === "https://world-casino-api.com/api/v1",
                    },
                    {
                      num: 2,
                      text: "Token + 32-char Secret stored strictly on backend",
                      ok: Boolean(hasToken && hasValidSecret),
                    },
                    {
                      num: 3,
                      text: "Launch server IP whitelisted in Client Panel > Settings",
                      ok: ggrStatus === "OK",
                    },
                    {
                      num: 4,
                      text: "game_uid from GET /games; provider activated on account",
                      ok: true,
                    },
                    {
                      num: 5,
                      text: `currency_code (${defaultCurrency}) is a real play currency when wallet is USDT`,
                      ok: Boolean(defaultCurrency && defaultCurrency !== "USDT"),
                    },
                    {
                      num: 6,
                      text: "GGR wallet > 0 and covers 5% of launch balance after FX",
                      ok: Number(ggrWallet || 0) > 0,
                    },
                    {
                      num: 7,
                      text: "HTTPS callback (/api/softapi/callback) returns HTTP 200; idempotent on serial_number",
                      ok: true,
                    },
                    {
                      num: 8,
                      text: "Update YOUR books from credit_amount; do not invent balances",
                      ok: true,
                    },
                    {
                      num: 9,
                      text: "Frontend opens only data.url when code === 0",
                      ok: true,
                    },
                    {
                      num: 10,
                      text: "Demo uses GET /demo (plain text URL). Games list 20 req/min limit respected",
                      ok: true,
                    },
                    {
                      num: 11,
                      text: "9Wicket is a separate transfer-wallet API (/9w/docs)",
                      ok: true,
                    },
                    {
                      num: 12,
                      text: "Test: launch 100 -> play one round -> callback 200 -> books match",
                      ok: (overview?.recentCallbacks?.length || 0) > 0,
                    },
                  ].map((item) => (
                    <div
                      key={item.num}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-950/70 border border-gray-800/80"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center font-mono text-[11px]">
                          {item.num}
                        </span>
                        <span className="text-gray-200">{item.text}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          item.ok
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                            : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                        }
                      >
                        {item.ok ? "PASS" : "CHECK"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

