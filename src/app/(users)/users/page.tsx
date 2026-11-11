"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import CookieLoader from "@/components/loaders/cookie-loader";
import { TableSkeletonLoader } from "@/components/loaders/table-loader";
import { useFetchUsersQuery } from "@/lib/features/usersApiSlice";
import Link from "next/link";

const Users: React.FC = () => {
  const [filter, setFilter] = useState({
    limit: 10,
    search: "",
    status: "all",
    page: 1,
  });

  const { data, isLoading, isFetching } = useFetchUsersQuery(filter);
  const users = data?.users;
  const totalFound = data?.total;

  const handleChangeFilterValues = (name: string, value: any) => {
    setFilter((state) => ({ ...state, [name]: value, page: 1 }));
  };

  const renderStatusBadge = (isBanned: boolean) => {
    if (isBanned) {
      return (
        <Badge variant="destructive" className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
          Banned
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs">
        Active
      </Badge>
    );
  };

  const renderGameStatus = (gameStatus?: {
    isPlaying: boolean;
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
            <span className="text-xs font-semibold text-amber-300 mt-1 truncate max-w-[130px]">
              {gameStatus.lastGameName}
            </span>
          )}
        </div>
      );
    }

    if (gameStatus.lastActiveAt) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
            <span className="text-xs text-gray-400">Idle</span>
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[130px]" title={gameStatus.lastGameName}>
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

  const renderTableContent = () => {
    if (isFetching) return <TableSkeletonLoader />;
    return (
      <>
        <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/60">
          <Table>
            <TableHeader className="bg-gray-900/90 border-b border-gray-800">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="font-semibold text-gray-300">Player ID & Phone</TableHead>
                <TableHead className="font-semibold text-gray-300">Live Status</TableHead>
                <TableHead className="font-semibold text-gray-300">Current Balance</TableHead>
                <TableHead className="font-semibold text-gray-300">Deposits / Withdraws</TableHead>
                <TableHead className="font-semibold text-gray-300">Total Bet & Win</TableHead>
                <TableHead className="font-semibold text-gray-300">Win Rate</TableHead>
                <TableHead className="font-semibold text-gray-300">Account</TableHead>
                <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => {
                const balance = Number(user.wallet?.balance ?? 0);
                const totalBet = Number(user.bettingRecord?.totalBet ?? 0);
                const totalWin = Number(user.bettingRecord?.totalWin ?? 0);
                const winRate = user.bettingRecord?.winRate ?? 0;
                const deposit = user.financials?.totalDeposit ?? 0;
                const withdraw = user.financials?.totalWithdraw ?? 0;
                const netProfit = user.financials?.netProfit ?? 0;

                return (
                  <TableRow key={user.id} className="border-gray-800/80 hover:bg-gray-900/40 transition-colors">
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
                        <span className="text-xs text-gray-400 mt-0.5 font-mono">{user.phone}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-500">
                            Joined {moment(user.createdAt).format("DD MMM YYYY")}
                          </span>
                          {user.subAdmin ? (
                            <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[9px] px-1 py-0 font-mono">
                              Agent: {user.subAdmin.agentCode}
                            </Badge>
                          ) : (
                            <span className="text-[9px] text-gray-500 font-mono">Direct</span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Live Game Status */}
                    <TableCell>{renderGameStatus(user.gameStatus)}</TableCell>

                    {/* Current Balance */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          ৳ {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase">{user.wallet?.currency || "BDT"}</span>
                      </div>
                    </TableCell>

                    {/* Financials (Deposit / Withdraw / Net) */}
                    <TableCell>
                      <div className="flex flex-col text-xs font-mono space-y-0.5">
                        <span className="text-emerald-400">
                          + ৳ {deposit.toLocaleString()} <span className="text-gray-500 text-[10px]">dep</span>
                        </span>
                        <span className="text-rose-400">
                          - ৳ {withdraw.toLocaleString()} <span className="text-gray-500 text-[10px]">w/d</span>
                        </span>
                        <span className={`text-[11px] font-semibold ${netProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          Net: {netProfit >= 0 ? "+" : ""}৳ {netProfit.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Total Bet & Total Win */}
                    <TableCell>
                      <div className="flex flex-col text-xs font-mono space-y-0.5">
                        <span className="text-gray-200">
                          Bet: <strong className="text-amber-300">৳ {totalBet.toLocaleString()}</strong>
                        </span>
                        <span className="text-gray-400">
                          Win: <strong className="text-white">৳ {totalWin.toLocaleString()}</strong>
                        </span>
                      </div>
                    </TableCell>

                    {/* Win Rate */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${
                          winRate > 100
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : winRate >= 50
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {winRate.toFixed(1)}%
                      </Badge>
                    </TableCell>

                    {/* Account Status */}
                    <TableCell>{renderStatusBadge(user.isBanned)}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/users/${user.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs bg-gray-900 border-gray-700 hover:bg-gray-800 text-white cursor-pointer"
                          >
                            <i className="fas fa-eye mr-1"></i> View
                          </Button>
                        </Link>
                        <Link href={`/recharge`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Recharge / Add Balance"
                            className="h-8 px-2 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                          >
                            +৳
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                    No users found matching your search filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination bar */}
        <div className="px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div>
            Showing <span className="font-semibold text-white">{users?.length || 0}</span> of{" "}
            <span className="font-semibold text-white">{totalFound || 0}</span> users
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={users?.length === 0 || filter.page === 1}
              onClick={() => handleChangeFilterValues("page", filter.page - 1)}
              className="border-gray-700 bg-gray-900 text-white cursor-pointer"
            >
              <i className="fas fa-chevron-left mr-1"></i> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                users?.length === 0 ||
                Math.ceil((totalFound || 0) / filter.limit) <= filter.page
              }
              onClick={() => handleChangeFilterValues("page", filter.page + 1)}
              className="border-gray-700 bg-gray-900 text-white cursor-pointer"
            >
              Next <i className="fas fa-chevron-right ml-1"></i>
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <main className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>Users Management</span>
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {totalFound ?? 0} Total
              </Badge>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Live balances, real-time in-game status, deposit/withdraw P&amp;L, and betting records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/recharge">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                + Recharge User
              </Button>
            </Link>
            <Link href="/casino-api">
              <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                Casino API
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search" className="text-xs text-gray-400">
                Search Player ID or Phone
              </Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-xs">
                  <i className="fas fa-search"></i>
                </div>
                <Input
                  id="search"
                  type="text"
                  placeholder="e.g. 1001, 01712345678..."
                  className="pl-8 bg-gray-950 border-gray-800 text-sm"
                  value={filter.search}
                  onChange={(e) => handleChangeFilterValues("search", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter" className="text-xs text-gray-400">
                Account Status
              </Label>
              <Select
                value={filter.status}
                onValueChange={(value) => handleChangeFilterValues("status", value)}
              >
                <SelectTrigger id="status-filter" className="mt-1 bg-gray-950 border-gray-800 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="unbanned">Active Only</SelectItem>
                  <SelectItem value="banned">Banned Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit-filter" className="text-xs text-gray-400">
                Rows per page
              </Label>
              <Select
                value={String(filter.limit)}
                onValueChange={(val) => handleChangeFilterValues("limit", Number(val))}
              >
                <SelectTrigger id="limit-filter" className="mt-1 bg-gray-950 border-gray-800 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div>{renderTableContent()}</div>
      </main>

      {(!data || isLoading) && (
        <div className="flex w-full h-[60vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}
    </div>
  );
};

export default Users;
