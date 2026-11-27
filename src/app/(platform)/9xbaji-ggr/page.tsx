/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { toast } from "sonner";
import CookieLoader from "@/components/loaders/cookie-loader";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Coins,
  Check,
  Flame,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

const fmtTk = (n: number | null | undefined) =>
  `৳ ${Number(n ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function NineXBajiGgrControlPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [actionType, setActionType] = useState<"ADD" | "DEDUCT" | "SET_BALANCE">(
    "ADD"
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [rateInput, setRateInput] = useState("17");

  // Payment method & number state for 9xBaji GGR recharge
  const [methodName, setMethodName] = useState("bKash");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("Agent");
  const [methodInstructions, setMethodInstructions] = useState("Send Money / Cash Out only");

  const fetchState = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/9xbaji-ggr", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        setData(json);
        if (json.ggrRatePercent) {
          setRateInput(String(json.ggrRatePercent));
        }
      } else if (!silent) {
        toast.error(json?.error || "Failed to load 9xBaji GGR state");
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(err?.message || "Network error");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const timer = setInterval(() => fetchState(true), 12000);
    return () => clearInterval(timer);
  }, [fetchState]);

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/9xbaji-ggr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          amount: num,
          note: note.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        toast.success(json.message || "9xBaji GGR balance updated!");
        setData(json);
        setAmount("");
        setNote("");
      } else {
        toast.error(json?.error || "Update failed");
      }
    } catch {
      toast.error("Network error while updating 9xBaji GGR");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async (checked: boolean) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/9xbaji-ggr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_PAUSE",
          isGamesPaused: checked,
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        toast.success(json.message);
        setData(json);
      } else {
        toast.error(json?.error || "Failed to toggle game pause");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRate = async () => {
    const num = parseFloat(rateInput);
    if (!Number.isFinite(num) || num <= 0 || num > 100) {
      toast.error("Please enter a valid percentage between 1 and 100");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/9xbaji-ggr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_RATE",
          ratePercent: num,
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        toast.success(json.message);
        setData(json);
      } else {
        toast.error(json?.error || "Failed to update rate");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex w-full h-[65vh] justify-center items-center">
        <CookieLoader />
      </div>
    );
  }

  const remaining = Number(data?.remainingGgrBalance ?? 0);
  const allocated = Number(data?.allocatedCredit ?? 0);
  const netLoss = Number(data?.totalPlayerNetLoss ?? 0);
  const ggrConsumed = Number(data?.ggrConsumed ?? 0);
  const ratePercent = Number(data?.ggrRatePercent ?? 17);
  const masterProfit = Number(data?.masterNetProfitFromGgr ?? 0);
  const isGamesPaused = Boolean(data?.isGamesPaused);
  const isOutOfGgr = remaining <= 0;

  return (
    <div className="space-y-6">
      <main className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              <span>9xBaji GGR Master Billing Control</span>
              <Badge
                className={
                  !isGamesPaused && !isOutOfGgr
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                }
              >
                {!isGamesPaused && !isOutOfGgr
                  ? "GAMES ACTIVE"
                  : isGamesPaused
                  ? "PAUSED BY MASTER"
                  : "OUT OF GGR (0 BALANCE)"}
              </Badge>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Manage custom GGR credit for <strong>9xBaji (9xbaji.live)</strong>.
              Automatically deducts <strong>{ratePercent}%</strong> of player net
              gaming loss.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchState()}
            className="border-gray-700 bg-gray-900 text-gray-200 hover:text-white cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Live
          </Button>
        </div>

        {/* 4 Summary Cards (2 per row on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: 9xBaji Remaining GGR Balance */}
          <Card
            className={`bg-gray-900/90 shadow-md ${
              remaining > 0 ? "border-emerald-500/40" : "border-rose-500/50"
            }`}
          >
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-emerald-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">9xBaji Live GGR Balance</span>
                <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
              </CardDescription>
              <CardTitle
                className={`text-base sm:text-xl md:text-2xl font-extrabold font-mono truncate ${
                  remaining > 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {fmtTk(remaining)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                Given Credit: {fmtTk(allocated)}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: 9xBaji Player Net Loss */}
          <Card className="bg-gray-900/90 border-amber-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-amber-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">9xBaji Player Net Loss</span>
                <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-amber-400 font-mono truncate">
                {fmtTk(netLoss)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                Bet: {fmtTk(data?.totalBet)} • Win: {fmtTk(data?.totalWin)}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: GGR Deducted from 9xBaji (17%) */}
          <Card className="bg-gray-900/90 border-rose-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-rose-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">
                  GGR Deducted ({ratePercent}%)
                </span>
                <Flame className="w-4 h-4 text-rose-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-rose-400 font-mono truncate">
                -{fmtTk(ggrConsumed)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                {data?.totalRounds ?? 0} total game rounds
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Your Master Net Margin (17% - 6% = 11%) */}
          <Card className="bg-gray-900/90 border-sky-500/30 shadow-md">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-[11px] sm:text-xs text-sky-300 font-semibold flex items-center justify-between gap-1">
                <span className="truncate">Your GGR Margin Profit</span>
                <TrendingUp className="w-4 h-4 text-sky-400 shrink-0" />
              </CardDescription>
              <CardTitle className="text-base sm:text-xl md:text-2xl font-extrabold text-sky-400 font-mono truncate">
                +{fmtTk(masterProfit)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                SoftAPI Cost (~6%): {fmtTk(data?.actualSoftApiCost6Pct)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add / Deduct Balance Form & Master Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Columns: Add / Deduct / Set Balance */}
          <Card className="lg:col-span-2 bg-gray-900/90 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-white">
                Give or Adjust 9xBaji GGR Balance
              </CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Any balance you add or set here updates live on the{" "}
                <strong>9xBaji Admin Dashboard</strong> immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBalanceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-300">Action Type</Label>
                    <Select
                      value={actionType}
                      onValueChange={(v: any) => setActionType(v)}
                    >
                      <SelectTrigger className="mt-1 bg-gray-950 border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="ADD">
                          + Add GGR Balance (Top-up)
                        </SelectItem>
                        <SelectItem value="DEDUCT">
                          - Deduct GGR Balance
                        </SelectItem>
                        <SelectItem value="SET_BALANCE">
                          = Set Exact Remaining Balance
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-300">
                      Amount (BDT ৳) *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1 bg-gray-950 border-gray-800 font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-300">
                      Note / Reference
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. bKash Top-up 5000 BDT"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-1 bg-gray-950 border-gray-800"
                    />
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400">Quick Amount:</span>
                  {[1000, 2000, 5000, 10000, 25000, 50000].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAmount(String(preset))}
                      className="h-7 px-2.5 text-xs bg-gray-950 border-gray-800 hover:border-amber-500/40 text-amber-300 font-mono cursor-pointer"
                    >
                      ৳{preset.toLocaleString()}
                    </Button>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className={`w-full sm:w-auto font-semibold cursor-pointer ${
                    actionType === "DEDUCT"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {actionType === "ADD" ? (
                    <>
                      <PlusCircle className="w-4 h-4 mr-1.5" />
                      Add GGR Balance to 9xBaji
                    </>
                  ) : actionType === "DEDUCT" ? (
                    <>
                      <MinusCircle className="w-4 h-4 mr-1.5" />
                      Deduct GGR Balance from 9xBaji
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-1.5" />
                      Set Exact 9xBaji GGR Balance
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column: Rate & Emergency Kill Switch */}
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Billing Rate &amp; Game Switch</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Control 9xBaji&apos;s GGR deduction percentage and game access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-300">
                  9xBaji GGR Deduction Rate (%)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="bg-gray-950 border-gray-800 font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleUpdateRate}
                    disabled={submitting}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold cursor-pointer"
                  >
                    Save {rateInput}%
                  </Button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Default is <strong>17%</strong> of net player gaming loss.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Pause All 9xBaji Games
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Instantly block game launches on 9xbaji.live
                  </div>
                </div>
                <Switch
                  checked={isGamesPaused}
                  onCheckedChange={handleTogglePause}
                  disabled={submitting}
                />
              </div>

              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800/80 text-xs space-y-1 text-gray-400">
                <div className="flex justify-between">
                  <span>9xBaji Total Players:</span>
                  <strong className="text-white font-mono">
                    {data?.siteStats?.totalUsers ?? 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>9xBaji Approved Deposits:</span>
                  <strong className="text-emerald-400 font-mono">
                    {fmtTk(data?.siteStats?.totalDeposits)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>9xBaji Approved Withdraws:</span>
                  <strong className="text-rose-400 font-mono">
                    {fmtTk(data?.siteStats?.totalWithdraws)}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods & Recharge Requests for 9xBaji */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Set Payment Methods & Numbers */}
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                GGR Recharge Methods &amp; Numbers
              </CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Add payment methods and numbers here. 9xBaji Admin will see these numbers when recharging GGR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-300">Method Name</Label>
                  <Input
                    value={methodName}
                    onChange={(e) => setMethodName(e.target.value)}
                    placeholder="bKash / Nagad / USDT"
                    className="mt-1 bg-gray-950 border-gray-800 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-300">Account Type</Label>
                  <Input
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    placeholder="Agent / Personal / TRC20"
                    className="mt-1 bg-gray-950 border-gray-800 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-300">Account / Wallet Number *</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="mt-1 bg-gray-950 border-gray-800 text-white font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300">Instructions</Label>
                <Input
                  value={methodInstructions}
                  onChange={(e) => setMethodInstructions(e.target.value)}
                  placeholder="Send Money / Cash Out only"
                  className="mt-1 bg-gray-950 border-gray-800 text-white"
                />
              </div>
              <Button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  if (!methodName.trim() || !accountNumber.trim()) {
                    toast.error("Method name and account number are required");
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const res = await fetch("/api/9xbaji-ggr", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "SAVE_METHOD",
                        methodName: methodName.trim(),
                        accountNumber: accountNumber.trim(),
                        accountType: accountType.trim(),
                        instructions: methodInstructions.trim(),
                      }),
                    });
                    const json = await res.json();
                    if (res.ok && json?.success) {
                      setData(json);
                      setAccountNumber("");
                      toast.success(json.message || "Method added!");
                    } else {
                      toast.error(json?.error || "Failed to save method");
                    }
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Payment Method &amp; Number
              </Button>

              <div className="space-y-2 pt-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-gray-400">
                  Active Methods on 9xBaji ({data?.paymentMethods?.length ?? 0})
                </p>
                {(data?.paymentMethods || []).map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {m.methodName}{" "}
                        <span className="text-xs text-gray-400">({m.accountType})</span>
                      </p>
                      <p className="text-xs font-mono text-emerald-400">{m.accountNumber}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          const res = await fetch("/api/9xbaji-ggr", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "DELETE_METHOD", id: m.id }),
                          });
                          const json = await res.json();
                          if (res.ok && json?.success) {
                            setData(json);
                            toast.success("Method removed");
                          }
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 9xBaji GGR Recharge Requests */}
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-white">
                9xBaji GGR Recharge Requests
              </CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Approve or reject GGR recharge requests submitted by 9xBaji Admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/60">
                <Table>
                  <TableHeader className="bg-gray-900/90 border-b border-gray-800">
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-300">Method / Number</TableHead>
                      <TableHead className="text-gray-300">TrxID</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.rechargeRequests || []).map((r: any) => (
                      <TableRow key={r.id} className="border-gray-800/80">
                        <TableCell className="text-xs text-white">
                          <div className="font-semibold">{r.methodName}</div>
                          <div className="text-gray-400 font-mono">{r.accountNumber}</div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-amber-300">
                          {r.trxId}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-400">
                          {fmtTk(r.amount)}
                        </TableCell>
                        <TableCell>
                          {r.status === "PENDING" ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                disabled={submitting}
                                onClick={async () => {
                                  setSubmitting(true);
                                  try {
                                    const res = await fetch("/api/9xbaji-ggr", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        action: "REVIEW_REQUEST",
                                        requestId: r.id,
                                        decision: "APPROVED",
                                      }),
                                    });
                                    const json = await res.json();
                                    if (res.ok && json?.success) {
                                      setData(json);
                                      toast.success(json.message);
                                    } else {
                                      toast.error(json?.error || "Failed");
                                    }
                                  } finally {
                                    setSubmitting(false);
                                  }
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black h-7 px-2 text-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={submitting}
                                onClick={async () => {
                                  setSubmitting(true);
                                  try {
                                    const res = await fetch("/api/9xbaji-ggr", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        action: "REVIEW_REQUEST",
                                        requestId: r.id,
                                        decision: "REJECTED",
                                      }),
                                    });
                                    const json = await res.json();
                                    if (res.ok && json?.success) {
                                      setData(json);
                                      toast.success(json.message);
                                    }
                                  } finally {
                                    setSubmitting(false);
                                  }
                                }}
                                className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 h-7 px-2 text-xs cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              {r.status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.rechargeRequests || data.rechargeRequests.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500 text-xs">
                          No GGR recharge requests from 9xBaji yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger History Table */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-white">
              9xBaji GGR Balance Transfer History
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Complete audit log of all GGR credits added, deducted, or set for
              9xBaji.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/60">
              <Table>
                <TableHeader className="bg-gray-900/90 border-b border-gray-800">
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-300">Date &amp; Time</TableHead>
                    <TableHead className="text-gray-300">Action</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Note / Reference</TableHead>
                    <TableHead className="text-gray-300">By Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.ledger || []).map((entry: any) => (
                    <TableRow
                      key={entry.id}
                      className="border-gray-800/80 hover:bg-gray-900/40"
                    >
                      <TableCell className="text-xs text-gray-300 font-mono whitespace-nowrap">
                        {moment(entry.createdAt).format(
                          "DD MMM YYYY, hh:mm:ss A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            entry.type === "ADD"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs"
                              : entry.type === "DEDUCT"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs"
                              : "bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs"
                          }
                        >
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-sm text-white">
                        {entry.type === "DEDUCT" ? "-" : "+"}
                        {fmtTk(entry.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-300">
                        {entry.note}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {entry.createdBy}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.ledger || data.ledger.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No GGR balance transfers recorded yet. Add an initial
                        GGR balance above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
