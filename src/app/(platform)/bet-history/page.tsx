"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import moment from "moment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CookieLoader from "@/components/loaders/cookie-loader";
import { Gamepad2, RefreshCw, Search } from "lucide-react";

interface AdminBetRow {
  id: string;
  serialNumber: string;
  userId: string;
  userPhone: string;
  playerId: string;
  userName: string;
  gameUid: string;
  gameName: string;
  provider?: string | null;
  brandId?: string | null;
  category?: string | null;
  gameRound?: string | null;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  creditAmount: number;
  status: string;
  freeSpinBonus?: string | null;
  createdAt: string;
}

interface SummaryStats {
  totalBet: number;
  totalWin: number;
  casinoNetProfit: number;
  totalRounds: number;
  winCount: number;
  lossCount: number;
}

export default function AdminBetHistoryPage() {
  const [bets, setBets] = useState<AdminBetRow[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalBet: 0,
    totalWin: 0,
    casinoNetProfit: 0,
    totalRounds: 0,
    winCount: 0,
    lossCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  const loadBets = useCallback(
    async (pageNum = page, statusVal = statusFilter, query = search) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(limit),
          status: statusVal,
        });
        if (query.trim()) {
          params.set("q", query.trim());
        }
        const res = await fetch(`/api/bet-history?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data?.success) {
          setBets(data.bets || []);
          if (data.summary) setSummary(data.summary);
          setTotal(Number(data.total || 0));
          setPage(pageNum);
        }
      } catch (err) {
        console.error("Failed to load bet history:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, search]
  );

  useEffect(() => {
    loadBets(1, statusFilter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-slate-900 to-amber-950/30 p-6 rounded-xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-amber-400" />
            Casino &amp; Sports Bet History
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Real-time round-by-round player bets, multipliers, payouts, and
            post-round wallet balances.
          </p>
        </div>
        <Button
          onClick={() => loadBets(page, statusFilter, search)}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Bets
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              Total Bet Turnover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-400">
              ৳{" "}
              {summary.totalBet.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across {summary.totalRounds} total rounds
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              Total Player Payouts (Wins)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ৳{" "}
              {summary.totalWin.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Won rounds: {summary.winCount}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              House Net Profit (GGR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                summary.casinoNetProfit >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {summary.casinoNetProfit >= 0 ? "+" : ""}৳{" "}
              {summary.casinoNetProfit.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.casinoNetProfit >= 0
                ? "House profit from bets"
                : "Player net ahead"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase">
              Win / Loss Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-lg font-bold font-mono">
              <span className="text-emerald-400">{summary.winCount} W</span>
              <span className="text-gray-600">/</span>
              <span className="text-rose-400">{summary.lossCount} L</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total logged rounds: {summary.totalRounds}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="bg-gray-900/90 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">All Bet Rounds</CardTitle>
              <CardDescription className="text-xs">
                Filter by Win/Loss or search by Player ID, Phone, Game Name, or
                Round ID.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "WIN", "LOSS", "REFUND"].map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={statusFilter === st ? "default" : "outline"}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs h-8 ${
                    statusFilter === st
                      ? "bg-amber-500 text-black font-bold"
                      : "border-gray-700 bg-gray-800 text-gray-300"
                  }`}
                >
                  {st === "ALL" ? "All Bets" : st}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
            <div className="md:col-span-9 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadBets(1, statusFilter, search);
                  }
                }}
                placeholder="Search by Player Phone, Player ID, Game Name, Game UID, or Round ID..."
                className="pl-9 bg-gray-950 border-gray-800"
              />
            </div>
            <div className="md:col-span-3">
              <Button
                onClick={() => loadBets(1, statusFilter, search)}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Search Bets
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-16 flex justify-center">
              <CookieLoader />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-gray-800 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead>Player</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Round / Serial</TableHead>
                      <TableHead>Stake (Bet)</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Payout (Win)</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Balance After</TableHead>
                      <TableHead className="text-right">Date &amp; Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bets.map((b) => (
                      <TableRow
                        key={b.id}
                        className="border-gray-800/80 hover:bg-gray-800/40"
                      >
                        <TableCell>
                          <Link
                            href={`/users/${b.userId}`}
                            className="flex flex-col hover:underline"
                          >
                            <span className="font-semibold text-blue-400 text-xs">
                              {b.userPhone}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              ID: {b.playerId}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white text-xs">
                              {b.gameName}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono">
                              UID: {b.gameUid}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-300">
                          #{b.gameRound || b.serialNumber.slice(0, 14)}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-amber-400 text-xs">
                          ৳{" "}
                          {b.betAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span
                            className={
                              b.multiplier > 1
                                ? "text-emerald-400 font-bold"
                                : "text-gray-400"
                            }
                          >
                            {b.multiplier.toFixed(2)}x
                          </span>
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-xs">
                          <span
                            className={
                              b.winAmount > 0
                                ? "text-emerald-400"
                                : "text-gray-500"
                            }
                          >
                            ৳{" "}
                            {b.winAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold ${
                              b.status === "WIN"
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : b.status === "REFUND"
                                ? "border-sky-500/40 text-sky-400 bg-sky-500/10"
                                : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                            }`}
                          >
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-300">
                          ৳{" "}
                          {b.creditAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right text-xs text-gray-400 whitespace-nowrap">
                          {moment(b.createdAt).format("DD MMM, hh:mm:ss A")}
                        </TableCell>
                      </TableRow>
                    ))}

                    {bets.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-12 text-gray-500 text-sm"
                        >
                          No bet records found matching your filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Page {page} of {totalPages} ({total} total records)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => loadBets(page - 1, statusFilter, search)}
                      className="border-gray-700 bg-gray-800"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => loadBets(page + 1, statusFilter, search)}
                      className="border-gray-700 bg-gray-800"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
