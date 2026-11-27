"use client";

import React, { useState } from "react";
import Link from "next/link";
import moment from "moment";
import CookieLoader from "@/components/loaders/cookie-loader";
import { TableSkeletonLoader } from "@/components/loaders/table-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualWithdrawModal } from "@/components/user/ManualWithdrawModal";
import { UserPasswordModal } from "@/components/user/UserPasswordModal";
import { useFetchUsersQuery } from "@/lib/features/usersApiSlice";
import {
  Activity,
  Flame,
  Gamepad2,
  Globe,
  MapPin,
  RefreshCw,
  Search,
  Smartphone,
  TrendingDown,
  Users,
} from "lucide-react";

export default function ActiveUsersPage() {
  const [filter, setFilter] = useState({
    limit: 15,
    search: "",
    status: "active", // active | playing | today | top_ggr
    page: 1,
  });

  const { data, isLoading, isFetching, refetch } = useFetchUsersQuery(filter);
  const users = data?.users || [];
  const totalFound = data?.total || 0;
  const summary = data?.summary;

  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
  const [selectedUserForWithdraw, setSelectedUserForWithdraw] = useState<any>(null);

  const handleChangeFilterValues = (name: string, value: any) => {
    setFilter((state) => ({
      ...state,
      [name]: value,
      page: name === "page" ? Number(value) : 1,
    }));
  };

  const renderPlatformAndLocation = (gameStatus?: {
    platform?: string;
    device?: string;
    ip?: string;
    location?: string;
    isp?: string;
  }) => {
    const isApp = gameStatus?.platform === "app";
    const deviceLabel =
      gameStatus?.device || (isApp ? "Android APK" : "Web Browser");
    const locationLabel = gameStatus?.location || "Bangladesh";
    const ipLabel = gameStatus?.ip;

    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-1.5">
          {isApp ? (
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-purple-400" />
              APP ({deviceLabel})
            </Badge>
          ) : (
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-400" />
              WEB ({deviceLabel})
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[155px]" title={locationLabel}>
            {locationLabel}
          </span>
        </div>
        {ipLabel && (
          <span
            className="text-[10px] text-gray-400 font-mono truncate max-w-[155px]"
            title={gameStatus?.isp ? `${ipLabel} (${gameStatus.isp})` : ipLabel}
          >
            IP: {ipLabel}
            {gameStatus?.isp ? ` • ${gameStatus.isp}` : ""}
          </span>
        )}
      </div>
    );
  };

  const renderGameStatus = (gameStatus?: {
    isPlaying: boolean;
    isOnline?: boolean;
    platform?: string;
    lastGameName?: string;
    lastActiveAt?: string;
  }) => {
    if (!gameStatus) {
      return <span className="text-xs text-gray-500">Offline</span>;
    }

    if (gameStatus.isPlaying) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] px-1.5 py-0 font-medium">
              In-Game
            </Badge>
          </div>
          {gameStatus.lastGameName && (
            <span className="text-xs font-semibold text-amber-300 mt-1 truncate max-w-[140px]">
              {gameStatus.lastGameName}
            </span>
          )}
        </div>
      );
    }

    if (gameStatus.isOnline) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex rounded-full h-2 w-2 bg-sky-400 animate-pulse"></span>
            <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] px-1.5 py-0 font-medium">
              Online
            </Badge>
          </div>
          <span
            className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[140px]"
            title={gameStatus.lastGameName}
          >
            {gameStatus.lastGameName ? `${gameStatus.lastGameName} • ` : ""}
            {gameStatus.lastActiveAt
              ? `${moment(gameStatus.lastActiveAt).fromNow(true)} ago`
              : "Active now"}
          </span>
        </div>
      );
    }

    if (gameStatus.lastActiveAt) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex rounded-full h-2 w-2 bg-amber-500/70"></span>
            <span className="text-xs text-gray-300">Active</span>
          </div>
          <span
            className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[140px]"
            title={gameStatus.lastGameName}
          >
            {gameStatus.lastGameName ? `${gameStatus.lastGameName} • ` : ""}
            {moment(gameStatus.lastActiveAt).fromNow(true)} ago
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex rounded-full h-2 w-2 bg-gray-600"></span>
        <span className="text-xs text-gray-500">Offline</span>
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalFound / filter.limit));

  return (
    <div className="space-y-6">
      <main className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              <span>Active Users &amp; Player GGR Tracker</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {totalFound} Found
              </Badge>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Real-time online players, active in-game sessions, and exact GGR fee consumed per player.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-gray-700 bg-gray-900 text-gray-200 hover:text-white cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh Live
            </Button>
            <Link href="/users">
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
              >
                All Users
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards (2 per row on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Live In-Game Now */}
          <Card className="bg-gray-900/90 border-emerald-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-emerald-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Live In-Game Now</span>
                <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono">
                {summary?.livePlayingCount ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                Playing within last 15 mins
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Active Today (24h) */}
          <Card className="bg-gray-900/90 border-sky-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-sky-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Active Today (24h)</span>
                <Users className="w-4 h-4 text-sky-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl font-extrabold text-sky-400 font-mono">
                {summary?.activeTodayCount ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {summary?.onlineNowCount ?? 0} Online • App:{" "}
                <strong className="text-purple-300">
                  {summary?.appActiveCount ?? 0}
                </strong>{" "}
                | Web:{" "}
                <strong className="text-blue-300">
                  {summary?.webActiveCount ?? 0}
                </strong>
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Total Player Net Loss */}
          <Card className="bg-gray-900/90 border-amber-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-amber-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Total Player Loss</span>
                <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-amber-400 font-mono truncate">
                ৳{" "}
                {(summary?.totalPlayerNetLoss ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                Net gaming loss by players
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Total GGR Deducted */}
          <Card className="bg-gray-900/90 border-rose-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-rose-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Total GGR Deducted</span>
                <Flame className="w-4 h-4 text-rose-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-rose-400 font-mono truncate">
                -৳{" "}
                {(summary?.totalGgrDeducted ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                GGR fee deducted by SoftAPI
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs & Search */}
        <Card className="bg-gray-900/80 border-gray-800">
          <CardContent className="p-4 space-y-4">
            <Tabs
              value={filter.status}
              onValueChange={(val) => handleChangeFilterValues("status", val)}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
                <TabsTrigger
                  value="active"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  All Active Players
                </TabsTrigger>
                <TabsTrigger
                  value="playing"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  Live In-Game Now
                </TabsTrigger>
                <TabsTrigger
                  value="today"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  Active Today (24h)
                </TabsTrigger>
                <TabsTrigger
                  value="top_ggr"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  Top GGR Consumed
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs text-gray-400">
                  Search Player ID or Phone
                </Label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search by phone or player ID..."
                    className="pl-9 bg-gray-950 border-gray-800 text-sm"
                    value={filter.search}
                    onChange={(e) =>
                      handleChangeFilterValues("search", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-400">Rows per page</Label>
                <Select
                  value={String(filter.limit)}
                  onValueChange={(val) =>
                    handleChangeFilterValues("limit", Number(val))
                  }
                >
                  <SelectTrigger className="mt-1 bg-gray-950 border-gray-800 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="15">15 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users & GGR Table */}
        {isFetching ? (
          <TableSkeletonLoader />
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/60">
              <Table>
                <TableHeader className="bg-gray-900/90 border-b border-gray-800">
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="font-semibold text-gray-300">
                      Player ID &amp; Phone
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Live Status &amp; Game
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Platform &amp; Location
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Wallet Balance
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Total Bet &amp; Win
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Player Net Loss
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      GGR Deducted
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Deposits / Withdraws
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const balance = Number(user.wallet?.balance ?? 0);
                    const totalBet = Number(user.bettingRecord?.totalBet ?? 0);
                    const totalWin = Number(user.bettingRecord?.totalWin ?? 0);
                    const playerLoss =
                      user.bettingRecord?.playerNetLoss ??
                      Math.max(0, totalBet - totalWin);
                    const ggrCut = user.bettingRecord?.ggrDeducted ?? 0;
                    const deposit = user.financials?.totalDeposit ?? 0;
                    const withdraw = user.financials?.totalWithdraw ?? 0;

                    return (
                      <TableRow
                        key={user.id}
                        className="border-gray-800/80 hover:bg-gray-900/40 transition-colors"
                      >
                        {/* Player Info */}
                        <TableCell>
                          <div className="flex flex-col">
                            <Link
                              href={`/users/${user.id}`}
                              className="font-bold text-sm text-white hover:text-amber-400 transition-colors flex items-center gap-1.5"
                            >
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono">
                                ♠
                              </span>
                              {user.playerId}
                            </Link>
                            <span className="text-xs text-gray-400 mt-0.5 font-mono">
                              {user.phone}
                            </span>
                          </div>
                        </TableCell>

                        {/* Live Status */}
                        <TableCell>{renderGameStatus(user.gameStatus)}</TableCell>

                        {/* Platform (App/Web) & Location */}
                        <TableCell>
                          {renderPlatformAndLocation(user.gameStatus)}
                        </TableCell>

                        {/* Current Balance */}
                        <TableCell>
                          <span className="text-sm font-bold text-amber-400 font-mono">
                            ৳{" "}
                            {balance.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>

                        {/* Total Bet & Win */}
                        <TableCell>
                          <div className="flex flex-col text-xs font-mono space-y-0.5">
                            <span className="text-gray-200">
                              Bet:{" "}
                              <strong className="text-amber-300">
                                ৳ {totalBet.toLocaleString()}
                              </strong>
                            </span>
                            <span className="text-gray-400">
                              Win:{" "}
                              <strong className="text-white">
                                ৳ {totalWin.toLocaleString()}
                              </strong>
                            </span>
                          </div>
                        </TableCell>

                        {/* Player Net Loss */}
                        <TableCell>
                          <span className="text-xs font-bold text-amber-300 font-mono">
                            ৳{" "}
                            {playerLoss.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>

                        {/* GGR Deducted */}
                        <TableCell>
                          <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-xs">
                            -৳{" "}
                            {ggrCut.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </Badge>
                        </TableCell>

                        {/* Deposits / Withdraws */}
                        <TableCell>
                          <div className="flex flex-col text-xs font-mono space-y-0.5">
                            <span className="text-emerald-400">
                              +৳ {deposit.toLocaleString()} dep
                            </span>
                            <span className="text-rose-400">
                              -৳ {withdraw.toLocaleString()} w/d
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/users/${user.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs bg-gray-900 border-gray-700 hover:bg-gray-800 text-white cursor-pointer"
                              >
                                <i className="fas fa-eye mr-1"></i> View
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Manual Withdraw"
                              onClick={() => setSelectedUserForWithdraw(user)}
                              className="h-8 px-2 text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold cursor-pointer"
                            >
                              -৳
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-10 text-gray-500"
                      >
                        No active users found matching this filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Bar */}
            <div className="px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
              <div>
                Showing{" "}
                <span className="font-semibold text-white">{users.length}</span>{" "}
                of <span className="font-semibold text-white">{totalFound}</span>{" "}
                players (Page {filter.page} of {totalPages})
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filter.page <= 1}
                  onClick={() => {
                    handleChangeFilterValues(
                      "page",
                      Math.max(1, filter.page - 1)
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="border-gray-700 bg-gray-900 text-white cursor-pointer"
                >
                  <i className="fas fa-chevron-left mr-1"></i> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!totalFound || totalPages <= filter.page}
                  onClick={() => {
                    handleChangeFilterValues("page", filter.page + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="border-gray-700 bg-gray-900 text-white cursor-pointer"
                >
                  Next <i className="fas fa-chevron-right ml-1"></i>
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      {(!data || isLoading) && (
        <div className="flex w-full h-[60vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}

      <UserPasswordModal
        open={Boolean(selectedUserForPassword)}
        onOpenChange={(open) => !open && setSelectedUserForPassword(null)}
        user={selectedUserForPassword}
        onSuccess={() => refetch()}
      />

      <ManualWithdrawModal
        open={Boolean(selectedUserForWithdraw)}
        onOpenChange={(open) => !open && setSelectedUserForWithdraw(null)}
        user={selectedUserForWithdraw}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
