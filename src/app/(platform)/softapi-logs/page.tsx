/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TableSkeletonLoader } from "@/components/loaders/table-loader";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
  Code2,
  RefreshCw,
  Rocket,
  Search,
  Terminal,
} from "lucide-react";

export default function SoftApiLogsPage() {
  const [filter, setFilter] = useState({
    type: "ALL", // ALL | CALLBACK | LAUNCH | 9W_TRANSFER | ERROR
    search: "",
    page: 1,
    limit: 25,
  });

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const qs = new URLSearchParams({
          type: filter.type,
          search: filter.search,
          page: String(filter.page),
          limit: String(filter.limit),
        });
        const res = await fetch(`/api/softapi/logs?${qs.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json?.success) {
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch SoftAPI logs:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchLogs(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchLogs]);

  const handleChangeFilter = (name: string, value: any) => {
    setFilter((prev) => ({
      ...prev,
      [name]: value,
      page: name === "page" ? Number(value) : 1,
    }));
  };

  const logs: any[] = data?.logs || [];
  const totalFound = data?.total || 0;
  const summary = data?.summary;
  const totalPages = Math.max(1, Math.ceil(totalFound / filter.limit));

  const renderTypeBadge = (type: string, status?: string) => {
    if (type === "ERROR" || status === "ERROR") {
      return (
        <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          ERROR
        </Badge>
      );
    }
    if (type === "LAUNCH") {
      return (
        <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1 w-fit">
          <Rocket className="w-3 h-3 text-sky-400" />
          LAUNCH
        </Badge>
      );
    }
    if (type === "9W_TRANSFER") {
      return (
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1 w-fit">
          <ArrowRightLeft className="w-3 h-3 text-purple-400" />
          9WICKET
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1 w-fit">
        <Activity className="w-3 h-3 text-emerald-400" />
        CALLBACK
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <main className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Terminal className="w-6 h-6 text-emerald-400" />
              <span>SoftAPI Live Response &amp; Callback Logs</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {totalFound} Logs
              </Badge>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Real-time decrypted SoftAPI requests, settle callbacks, game launch responses, and 9Wicket wallet transfers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh((v) => !v)}
              className={`border-gray-700 text-xs cursor-pointer ${
                autoRefresh
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  : "bg-gray-900 text-gray-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  autoRefresh ? "bg-emerald-400 animate-ping" : "bg-gray-500"
                }`}
              />
              {autoRefresh ? "Live Auto-Sync (10s)" : "Auto-Sync Off"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchLogs()}
              className="border-gray-700 bg-gray-900 text-gray-200 hover:text-white cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* 4 Summary Cards (2 per row on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Callbacks Today */}
          <Card className="bg-gray-900/90 border-emerald-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-emerald-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Callbacks Today</span>
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono">
                {(summary?.todayCallbackCount ?? 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                HTTP 200 OK settle rounds today
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Last API Hit */}
          <Card className="bg-gray-900/90 border-sky-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-sky-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Last SoftAPI Hit</span>
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl font-extrabold text-sky-400 font-mono truncate">
                {summary?.lastCallbackAt
                  ? moment(summary.lastCallbackAt).fromNow()
                  : "No hits"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {summary?.lastCallbackAt
                  ? moment(summary.lastCallbackAt).format("hh:mm:ss A")
                  : "Waiting for traffic"}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: 9Wicket Active Sessions */}
          <Card className="bg-gray-900/90 border-purple-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-purple-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">9Wicket Open Sessions</span>
                <ArrowRightLeft className="w-4 h-4 text-purple-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl font-extrabold text-purple-400 font-mono">
                {summary?.open9WSessionsCount ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                In-Game Balance: ৳{" "}
                {(summary?.total9WLockedBalance ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Errors / Failed */}
          <Card className="bg-gray-900/90 border-rose-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-rose-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">API Errors / Failed</span>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl font-extrabold text-rose-400 font-mono">
                {summary?.errorCount ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                Launch or callback errors in buffer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs & Search */}
        <Card className="bg-gray-900/80 border-gray-800">
          <CardContent className="p-4 space-y-4">
            <Tabs
              value={filter.type}
              onValueChange={(val) => handleChangeFilter("type", val)}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1 p-1">
                <TabsTrigger
                  value="ALL"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  All API Logs
                </TabsTrigger>
                <TabsTrigger
                  value="CALLBACK"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  Bet Callbacks
                </TabsTrigger>
                <TabsTrigger
                  value="LAUNCH"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  Game Launch
                </TabsTrigger>
                <TabsTrigger
                  value="9W_TRANSFER"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  9Wicket Transfer
                </TabsTrigger>
                <TabsTrigger
                  value="ERROR"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  Errors Only
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs text-gray-400">
                  Search Phone, Game Name, Game UID, or Serial Number
                </Label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search player phone, game name, serial_number..."
                    className="pl-9 bg-gray-950 border-gray-800 text-sm"
                    value={filter.search}
                    onChange={(e) =>
                      handleChangeFilter("search", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-400">Rows per page</Label>
                <Select
                  value={String(filter.limit)}
                  onValueChange={(val) =>
                    handleChangeFilter("limit", Number(val))
                  }
                >
                  <SelectTrigger className="mt-1 bg-gray-950 border-gray-800 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        {loading && !data ? (
          <TableSkeletonLoader />
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/60">
              <Table>
                <TableHeader className="bg-gray-900/90 border-b border-gray-800">
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="font-semibold text-gray-300">
                      Time
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Event Type
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Player Phone / ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Game &amp; Serial
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Bet / Win
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      Wallet Before → After
                    </TableHead>
                    <TableHead className="font-semibold text-gray-300">
                      API Response Summary
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-300">
                      Payload
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const betAmt = Number(log.betAmount ?? 0);
                    const winAmt = Number(log.winAmount ?? 0);
                    const beforeAmt = Number(log.walletBefore ?? 0);
                    const afterAmt = Number(log.walletAfter ?? log.creditAmount ?? 0);

                    return (
                      <TableRow
                        key={log.id}
                        className="border-gray-800/80 hover:bg-gray-900/40 transition-colors"
                      >
                        {/* Time */}
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono text-white">
                              {moment(log.createdAt).format("hh:mm:ss A")}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {moment(log.createdAt).format("DD MMM")} •{" "}
                              {moment(log.createdAt).fromNow()}
                            </span>
                          </div>
                        </TableCell>

                        {/* Type Badge */}
                        <TableCell>
                          {renderTypeBadge(log.type, log.status)}
                        </TableCell>

                        {/* Player */}
                        <TableCell>
                          <div className="flex flex-col">
                            {log.userId ? (
                              <Link
                                href={`/users/${log.userId}`}
                                className="text-xs font-bold text-amber-400 hover:underline font-mono"
                              >
                                {log.phone}
                              </Link>
                            ) : (
                              <span className="text-xs font-bold text-white font-mono">
                                {log.phone}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 font-mono">
                              acc: {log.memberAccount}
                            </span>
                          </div>
                        </TableCell>

                        {/* Game & Serial */}
                        <TableCell>
                          <div className="flex flex-col max-w-[180px]">
                            <span
                              className="text-xs font-semibold text-white truncate"
                              title={log.gameName}
                            >
                              {log.gameName}{" "}
                              <span className="text-gray-400 font-mono text-[10px]">
                                (#{log.gameUid})
                              </span>
                            </span>
                            <span
                              className="text-[10px] text-gray-400 font-mono truncate"
                              title={log.serialNumber}
                            >
                              SN: {log.serialNumber}
                            </span>
                          </div>
                        </TableCell>

                        {/* Bet / Win */}
                        <TableCell>
                          <div className="flex flex-col text-xs font-mono space-y-0.5">
                            <span className="text-amber-300">
                              Bet: ৳{betAmt.toFixed(2)}
                            </span>
                            <span
                              className={
                                winAmt > betAmt
                                  ? "text-emerald-400 font-bold"
                                  : "text-gray-400"
                              }
                            >
                              Win: ৳{winAmt.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Wallet Before -> After */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className="text-gray-400">
                              ৳{beforeAmt.toFixed(2)}
                            </span>
                            <span className="text-gray-600">→</span>
                            <span className="font-bold text-emerald-400">
                              ৳{afterAmt.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Response Summary */}
                        <TableCell>
                          <div className="flex flex-col max-w-[230px]">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 font-mono ${
                                  log.status === "ERROR" || Number(log.code) !== 0
                                    ? "border-rose-500/40 text-rose-400"
                                    : "border-emerald-500/40 text-emerald-400"
                                }`}
                              >
                                code: {log.code ?? 0}
                              </Badge>
                              <span className="text-[11px] text-gray-300 truncate">
                                {log.roundResult}
                              </span>
                            </div>
                            <span
                              className="text-[11px] text-gray-400 truncate mt-0.5"
                              title={log.message}
                            >
                              {log.message}
                            </span>
                          </div>
                        </TableCell>

                        {/* JSON Action */}
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLog(log)}
                            className="h-7 px-2 text-xs bg-gray-900 border-gray-700 hover:bg-gray-800 text-amber-300 font-mono cursor-pointer"
                          >
                            <Code2 className="w-3.5 h-3.5 mr-1" />
                            JSON
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-10 text-gray-500"
                      >
                        No SoftAPI logs found matching your filter.
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
                <span className="font-semibold text-white">{logs.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-white">{totalFound}</span>{" "}
                logs (Page {filter.page} of {totalPages})
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filter.page <= 1}
                  onClick={() =>
                    handleChangeFilter("page", Math.max(1, filter.page - 1))
                  }
                  className="border-gray-700 bg-gray-900 text-white cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!totalFound || totalPages <= filter.page}
                  onClick={() => handleChangeFilter("page", filter.page + 1)}
                  className="border-gray-700 bg-gray-900 text-white cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Raw JSON Inspector Modal */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Code2 className="w-5 h-5 text-amber-400" />
              <span>SoftAPI Decrypted Request &amp; Response Inspector</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              {selectedLog?.gameName} (#{selectedLog?.gameUid}) • Player:{" "}
              {selectedLog?.phone} •{" "}
              {selectedLog?.createdAt
                ? moment(selectedLog.createdAt).format("DD MMM YYYY, hh:mm:ss A")
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="text-amber-400 font-semibold mb-1">
                  1. SoftAPI Request / Decrypted Callback Payload:
                </div>
                <pre className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-200 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.requestPayload, null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-emerald-400 font-semibold mb-1">
                  2. Server Response / SoftAPI Output:
                </div>
                <pre className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-emerald-300 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.responsePayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
