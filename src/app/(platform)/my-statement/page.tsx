"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import moment from "moment";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  FileSpreadsheet,
  Loader2,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

interface StatementRecord {
  id: string;
  direction: "GIVEN" | "TAKEN";
  category:
    | "MANUAL_ADD"
    | "DEPOSIT_APPROVED"
    | "MANUAL_WITHDRAW"
    | "WITHDRAW_APPROVED";
  categoryLabel: string;
  amount: number;
  user: {
    id: string;
    phone: string;
    playerId: string;
    name: string;
  };
  method: string;
  reference: string;
  note: string;
  adminName: string;
  createdAt: string;
}

interface StatementSummary {
  totalGiven: number;
  totalManualGiven: number;
  totalDepositGiven: number;
  givenCount: number;
  manualGivenCount?: number;
  depositGivenCount?: number;
  totalTaken: number;
  totalManualTaken: number;
  totalWithdrawTaken: number;
  takenCount: number;
  manualTakenCount?: number;
  withdrawTakenCount?: number;
  netDifference: number;
}

export default function MyStatementPage() {
  const [records, setRecords] = useState<StatementRecord[]>([]);
  const [summary, setSummary] = useState<StatementSummary>({
    totalGiven: 0,
    totalManualGiven: 0,
    totalDepositGiven: 0,
    givenCount: 0,
    totalTaken: 0,
    totalManualTaken: 0,
    totalWithdrawTaken: 0,
    takenCount: 0,
    netDifference: 0,
  });
  const [totalFound, setTotalFound] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState("ALL"); // ALL | GIVEN | TAKEN | MANUAL
  const [period, setPeriod] = useState("ALL"); // TODAY | YESTERDAY | 7D | 30D | ALL
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [isManualWithdrawOpen, setIsManualWithdrawOpen] = useState(false);

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: filterType,
        period,
        search,
        page: String(page),
        limit: String(limit),
      });
      if (dateRange.from) {
        params.set("from", dateRange.from.toISOString());
        params.set("to", (dateRange.to || dateRange.from).toISOString());
      }
      const res = await fetch(`/api/my-statement?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data?.success) {
        setRecords(data.records || []);
        setSummary(
          data.summary || {
            totalGiven: 0,
            totalManualGiven: 0,
            totalDepositGiven: 0,
            givenCount: 0,
            totalTaken: 0,
            totalManualTaken: 0,
            totalWithdrawTaken: 0,
            takenCount: 0,
            netDifference: 0,
          }
        );
        setTotalFound(data.totalFound || 0);
      }
    } catch (err) {
      console.error("Failed to load statement:", err);
    } finally {
      setLoading(false);
    }
  }, [filterType, period, dateRange, search, page, limit]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const totalPages = Math.max(1, Math.ceil(totalFound / limit));

  return (
    <div className="space-y-6">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-emerald-600/20 border border-blue-500/30 p-5 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge className="bg-blue-500 text-white font-bold uppercase text-[10px] px-2 py-0.5">
                  Admin Ledger
                </Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-300 text-[10px] font-mono"
                >
                  কাকে কি দিচ্ছি ও কার থেকে কি নিচ্ছি
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                <FileSpreadsheet className="w-7 h-7 text-blue-400 shrink-0" />
                <span>My Statement (মাই স্টেটমেন্ট)</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
                কোন ইউজারকে কত টাকা দিয়েছেন (Manual Recharge / Approved Deposit) এবং কার থেকে কত টাকা নিয়েছেন বা কেটেছেন (Manual Withdraw / Payout)—তার সম্পূর্ণ হিসাব ও রেকর্ড।
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/recharge">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Give Balance (+৳ দিন)
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => setIsManualWithdrawOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
              >
                <MinusCircle className="w-4 h-4 mr-1.5" />
                Take Balance (-৳ নিন)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchStatement}
                className="border-gray-700 bg-gray-900/80 text-gray-200 hover:text-white text-xs cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards (2 cards per row on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Deposit */}
          <Card className="bg-gray-900/90 border-emerald-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-emerald-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Total Deposit</span>
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-emerald-400 font-mono truncate">
                ৳{" "}
                {summary.totalDepositGiven.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {summary.depositGivenCount ?? 0} Approved Deposit
                {(summary.depositGivenCount ?? 0) !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Withdraw */}
          <Card className="bg-gray-900/90 border-rose-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-rose-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Total Withdraw</span>
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-rose-400 font-mono truncate">
                ৳{" "}
                {summary.totalWithdrawTaken.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {summary.withdrawTakenCount ?? 0} Approved Withdraw
                {(summary.withdrawTakenCount ?? 0) !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Total Manual Deposit */}
          <Card className="bg-gray-900/90 border-amber-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-amber-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Total Manual Deposit</span>
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-amber-400 font-mono truncate">
                ৳{" "}
                {summary.totalManualGiven.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {summary.manualGivenCount ?? 0} Manual Recharge
                {(summary.manualGivenCount ?? 0) !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Manual Withdraw */}
          <Card className="bg-gray-900/90 border-purple-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-purple-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Manual Withdraw</span>
                <MinusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-purple-400 font-mono truncate">
                ৳{" "}
                {summary.totalManualTaken.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {summary.manualTakenCount ?? 0} Manual Deduct
                {(summary.manualTakenCount ?? 0) !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Filters */}
        <Card className="bg-gray-900/80 border-gray-800">
          <CardContent className="p-4 space-y-4">
            <Tabs
              value={filterType}
              onValueChange={(val) => {
                setFilterType(val);
                setPage(1);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
                <TabsTrigger
                  value="ALL"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  সব হিসাব (All)
                </TabsTrigger>
                <TabsTrigger
                  value="GIVEN"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  কাকে কি দিয়েছি (+৳)
                </TabsTrigger>
                <TabsTrigger
                  value="TAKEN"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  কার থেকে নিয়েছি (-৳)
                </TabsTrigger>
                <TabsTrigger
                  value="MANUAL"
                  className="text-xs sm:text-sm py-1.5 px-2 truncate cursor-pointer"
                >
                  শুধু ম্যানুয়াল (Manual)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-gray-400">
                  Search User Phone, Player ID, TrxID or Note
                </Label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="ফোন নম্বর, প্লেয়ার আইডি বা নোট..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 bg-gray-950 border-gray-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-400">
                  Date Range Filter (তারিখ অনুযায়ী ফিল্টার)
                </Label>
                <div className="flex items-center gap-1.5 mt-1">
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full min-w-0 justify-start text-left font-normal bg-gray-950 border-gray-800 text-xs sm:text-sm overflow-hidden cursor-pointer"
                      >
                        <CalendarIcon className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            "Pick a date range"
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(
                            (range as {
                              from: Date | undefined;
                              to: Date | undefined;
                            }) || { from: undefined, to: undefined }
                          );
                          setPage(1);
                          if (range?.to) setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {dateRange.from && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined });
                        setPage(1);
                      }}
                      className="px-2 text-gray-400 hover:text-white shrink-0"
                      title="Clear Date Filter"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-400">Quick Time Period (সময়কাল)</Label>
                <Select
                  value={period}
                  onValueChange={(val) => {
                    setPeriod(val);
                    setDateRange({ from: undefined, to: undefined });
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="mt-1 bg-gray-950 border-gray-800 text-sm">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="ALL">All Time (সব সময়)</SelectItem>
                    <SelectItem value="TODAY">Today (আজকের হিসাব)</SelectItem>
                    <SelectItem value="YESTERDAY">Yesterday (গতকাল)</SelectItem>
                    <SelectItem value="7D">Last 7 Days (গত ৭ দিন)</SelectItem>
                    <SelectItem value="30D">Last 30 Days (গত ৩০ দিন)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statement Records Table */}
        <Card className="bg-gray-950/70 border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-900/90 border-b border-gray-800">
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-300 font-semibold">
                    Date & Time
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    Type (দেওয়া / নেওয়া)
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    User (কাকে / কার থেকে)
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    Amount (পরিমাণ)
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    Method & Ref
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    Details / Note
                  </TableHead>
                  <TableHead className="text-right text-gray-300 font-semibold">
                    By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span>স্টেটমেন্ট লোড হচ্ছে...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-gray-500"
                    >
                      কোনো স্টেটমেন্ট রেকর্ড পাওয়া যায়নি।
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((rec) => {
                    const isGiven = rec.direction === "GIVEN";
                    const isManual =
                      rec.category === "MANUAL_ADD" ||
                      rec.category === "MANUAL_WITHDRAW";

                    return (
                      <TableRow
                        key={rec.id}
                        className="border-gray-800/80 hover:bg-gray-900/40"
                      >
                        {/* Date */}
                        <TableCell className="whitespace-nowrap">
                          <div className="text-xs text-white font-mono">
                            {moment(rec.createdAt).format("DD MMM YYYY")}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            {moment(rec.createdAt).format("hh:mm:ss A")}
                          </div>
                        </TableCell>

                        {/* Direction & Category Badge */}
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {isGiven ? (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] whitespace-nowrap">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                দিয়েছি (Given)
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] whitespace-nowrap">
                                <ArrowDownLeft className="w-3 h-3 mr-1" />
                                নিয়েছি (Taken)
                              </Badge>
                            )}
                            <span
                              className={`text-[10px] font-medium ${
                                isManual ? "text-amber-300" : "text-gray-400"
                              }`}
                            >
                              {rec.categoryLabel}
                            </span>
                          </div>
                        </TableCell>

                        {/* User Info */}
                        <TableCell>
                          <Link
                            href={`/users/${rec.user.id}`}
                            className="hover:underline font-bold text-sm text-white hover:text-amber-400 block"
                          >
                            {rec.user.phone}
                          </Link>
                          <div className="text-[11px] text-gray-400 font-mono">
                            ID: {rec.user.playerId} • {rec.user.name}
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="whitespace-nowrap">
                          <span
                            className={`text-sm font-extrabold font-mono ${
                              isGiven ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isGiven ? "+" : "-"} ৳{" "}
                            {rec.amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>

                        {/* Method & Reference */}
                        <TableCell>
                          <div className="text-xs text-gray-200 font-medium">
                            {rec.method}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            Ref: {rec.reference}
                          </div>
                        </TableCell>

                        {/* Note */}
                        <TableCell className="max-w-[240px]">
                          <p
                            className="text-xs text-gray-300 line-clamp-2"
                            title={rec.note}
                          >
                            {rec.note}
                          </p>
                        </TableCell>

                        {/* Admin Name */}
                        <TableCell className="text-right whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="border-gray-700 text-gray-300 text-[10px] font-mono"
                          >
                            {rec.adminName}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
            <div>
              Showing{" "}
              <span className="font-semibold text-white">{records.length}</span>{" "}
              of <span className="font-semibold text-white">{totalFound}</span>{" "}
              statement records (Page {page} of {totalPages})
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="border-gray-700 bg-gray-900 text-white cursor-pointer"
              >
                <i className="fas fa-chevron-left mr-1"></i> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="border-gray-700 bg-gray-900 text-white cursor-pointer"
              >
                Next <i className="fas fa-chevron-right ml-1"></i>
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Direct Manual Withdraw Modal from Statement Page */}
      <ManualWithdrawModal
        open={isManualWithdrawOpen}
        onOpenChange={setIsManualWithdrawOpen}
        allowUserSearch={true}
        onSuccess={() => fetchStatement()}
      />
    </div>
  );
}
