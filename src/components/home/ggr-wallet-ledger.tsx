"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
import CookieLoader from "@/components/loaders/cookie-loader";
import { toast } from "sonner";

const tk = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : `৳ ${Number(n).toLocaleString("en-IN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}`;

const LOW_BALANCE_KEY = "ggr-low-balance-threshold";

// Circular capacity ring
function CapacityRing({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(percent / 100, 1) * circ;
  const color = percent >= 90 ? "#ef4444" : percent >= 70 ? "#f59e0b" : "#10b981";
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="70" y="63" textAnchor="middle" fill={color} fontSize="20" fontWeight="bold" fontFamily="monospace">
        {percent.toFixed(1)}%
      </text>
      <text x="70" y="82" textAnchor="middle" fill="#6b7280" fontSize="11">
        capacity used
      </text>
    </svg>
  );
}

export default function GgrWalletLedger() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<"TOPUP" | "OPENING" | "ADJUSTMENT">("TOPUP");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bKash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [lowThreshold, setLowThreshold] = useState(500);

  useEffect(() => {
    const saved = Number(localStorage.getItem(LOW_BALANCE_KEY));
    if (saved > 0) setLowThreshold(saved);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/softapi/topups", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to load");
        setData(null);
      } else {
        setError(null);
        setData(json);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasOpening = (data?.entries || []).some(
    (e: any) => e.type === "OPENING"
  );

  useEffect(() => {
    // First time: suggest recording the current balance as opening balance
    if (data && !hasOpening && (data.entries || []).length === 0) {
      setType("OPENING");
      if (data.liveBalance !== null) setAmount(String(data.liveBalance));
    }
  }, [data, hasOpening]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/softapi/topups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: Number(amount), method, reference, note }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Save failed");
        return;
      }
      toast.success(
        type === "OPENING"
          ? "Opening balance recorded"
          : type === "TOPUP"
          ? `Deposit of ${tk(Number(amount))} recorded`
          : "Adjustment recorded"
      );
      setAmount("");
      setReference("");
      setNote("");
      setType("TOPUP");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry? This changes your totals.")) return;
    const res = await fetch(`/api/softapi/topups?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) toast.error(json?.error || "Delete failed");
    else {
      toast.success("Entry deleted");
      load();
    }
  };

  if (loading && !data) {
    return (
      <div className="py-16 flex justify-center">
        <CookieLoader />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900/90 border-rose-500/30">
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-rose-400 font-medium">{error}</p>
          <Button onClick={load} variant="secondary">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const t = data?.totals || {};
  const live = data?.liveBalance as number | null;
  const isLow = live !== null && live < lowThreshold;

  return (
    <div className="space-y-6">
      {isLow && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-rose-300">
              Low GGR balance: {tk(live)}
            </p>
            <p className="text-xs text-rose-200/80">
              Below your alert level of {tk(lowThreshold, 0)}. Players with a
              balance above {tk(data?.maxLaunchBalance, 0)} can no longer launch
              games (code 12). Top up soon.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Live GGR Balance"
          value={tk(live)}
          sub="Fetched live from SoftAPI"
          accent="text-amber-400"
        />
        <Kpi
          label="Total Deposited"
          value={tk(t.totalFunded)}
          sub={`Opening ${tk(t.opening, 0)} + Top-ups ${tk(t.topups, 0)}${
            t.adjustments ? ` + Adj ${tk(t.adjustments, 0)}` : ""
          }`}
          accent="text-emerald-400"
        />
        <Kpi
          label="Total Used (GGR fees)"
          value={tk(t.used)}
          sub="Total deposited − live balance"
          accent="text-rose-400"
        />
        <Kpi
          label="Max Player Launch Balance"
          value={tk(data?.maxLaunchBalance, 0)}
          sub="Live balance ÷ 5% (above this → code 12)"
          accent="text-sky-400"
        />
      </div>

      {/* Usage bar */}
      <Card className="bg-gray-900/90 border-gray-800">
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-gray-300">
              Used{" "}
              <strong className="text-white">
                {t.usedPercent !== null && t.usedPercent !== undefined
                  ? `${t.usedPercent.toFixed(1)}%`
                  : "—"}
              </strong>{" "}
              of everything you deposited
            </span>
            <span className="text-xs text-gray-400">
              Avg usage/day: {tk(t.avgDailyUsage)} • Est. days left:{" "}
              <strong className="text-white">
                {t.daysLeft ? `${Math.floor(t.daysLeft)} days` : "—"}
              </strong>
              {t.lastTopupAt &&
                ` • Last top-up: ${new Date(t.lastTopupAt).toLocaleDateString()}`}
            </span>
          </div>
          <Progress value={t.usedPercent ?? 0} className="h-2.5" />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Label htmlFor="low-th" className="text-xs text-gray-400">
              Low-balance alert below ৳
            </Label>
            <Input
              id="low-th"
              type="number"
              value={lowThreshold}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLowThreshold(v);
                localStorage.setItem(LOW_BALANCE_KEY, String(v));
              }}
              className="w-28 h-7 bg-gray-950 border-gray-800 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* ===== CAPACITY MONITOR ===== */}
      <Card className="bg-gray-900/90 border-amber-500/20 border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white">
                Gameplay Capacity Monitor
              </CardTitle>
              <CardDescription>
                GGR balance ÷ 5% = max total user wallet allowed. When users'
                total balance hits this limit, new game launches fail (code 12).
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                data?.capacityUsedPercent == null
                  ? "border-gray-600 text-gray-400"
                  : data.capacityUsedPercent >= 90
                  ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                  : data.capacityUsedPercent >= 70
                  ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
              }
            >
              {data?.capacityUsedPercent == null
                ? "N/A"
                : data.capacityUsedPercent >= 90
                ? "CRITICAL"
                : data.capacityUsedPercent >= 70
                ? "WARNING"
                : "HEALTHY"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Donut ring */}
            {data?.capacityUsedPercent != null && (
              <CapacityRing percent={data.capacityUsedPercent} />
            )}

            {/* Breakdown */}
            <div className="flex-1 space-y-3 w-full">
              {/* Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Users&apos; total wallet balance</span>
                  <span className="font-mono text-white">
                    {tk(data?.totalUserWalletBalance)} /{" "}
                    {tk(data?.maxLaunchBalance, 0)}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      (data?.capacityUsedPercent ?? 0) >= 90
                        ? "bg-rose-500"
                        : (data?.capacityUsedPercent ?? 0) >= 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(data?.capacityUsedPercent ?? 0, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 4 metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                  <div className="text-[11px] text-gray-400 mb-1">GGR Balance</div>
                  <div className="text-sm font-bold text-amber-400">
                    {tk(live)}
                  </div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                  <div className="text-[11px] text-gray-400 mb-1">
                    Max Total User Balance
                  </div>
                  <div className="text-sm font-bold text-sky-400">
                    {tk(data?.maxLaunchBalance, 0)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    GGR ÷ 5%
                  </div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                  <div className="text-[11px] text-gray-400 mb-1">
                    Current User Total Balance
                  </div>
                  <div className="text-sm font-bold text-white">
                    {tk(data?.totalUserWalletBalance)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    All users&apos; wallets combined
                  </div>
                </div>
                <div
                  className={`rounded-lg p-3 border ${
                    (data?.remainingCapacity ?? 0) < 5000
                      ? "bg-rose-950/40 border-rose-500/30"
                      : "bg-gray-950 border-gray-800"
                  }`}
                >
                  <div className="text-[11px] text-gray-400 mb-1">
                    Remaining Capacity
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      (data?.remainingCapacity ?? 0) < 5000
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {tk(data?.remainingCapacity, 0)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    New deposits possible before code 12
                  </div>
                </div>
              </div>

              {/* How it works explanation */}
              <div className="bg-gray-950/50 rounded-lg p-3 border border-gray-800 text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300">কীভাবে কাজ করে:</strong>{" "}
                আপনার GGR balance{" "}
                <span className="text-amber-400 font-mono">{tk(live)}</span>
                {" → "}
                সর্বোচ্চ user balance{" "}
                <span className="text-sky-400 font-mono">
                  {tk(data?.maxLaunchBalance, 0)}
                </span>
                {" (÷5%). "}
                এখন সব user-এর মিলিয়ে{" "}
                <span className="text-white font-mono">
                  {tk(data?.totalUserWalletBalance)}
                </span>{" "}
                আছে। আর{" "}
                <span className="text-emerald-400 font-mono">
                  {tk(data?.remainingCapacity, 0)}
                </span>{" "}
                capacity বাকি — মানে এই পরিমাণ নতুন deposit হলেও সব user গেম
                খুলতে পারবে। এর বেশি হলে বড় balance-এর users আটকে যাবে।
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader>
            <CardTitle className="text-base">Record a GGR Deposit</CardTitle>
            <CardDescription>
              After you top up your SoftAPI wallet, record it here so the
              dashboard tracks how much you have put in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Entry type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="bg-gray-950 border-gray-800 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOPUP">Top-up (deposit)</SelectItem>
                    {!hasOpening && (
                      <SelectItem value="OPENING">
                        Opening balance (one time)
                      </SelectItem>
                    )}
                    <SelectItem value="ADJUSTMENT">
                      Adjustment (+ / −)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {type === "OPENING" && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    Record the balance you already had before using this
                    ledger (pre-filled with the live balance).
                  </p>
                )}
              </div>
              <div>
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="bg-gray-950 border-gray-800 mt-1"
                />
              </div>
              <div>
                <Label>Payment method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="bg-gray-950 border-gray-800 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["bKash", "Nagad", "Rocket", "Bank", "USDT", "Other"].map(
                      (m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transaction ID / Reference</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="TrxID or invoice no."
                  className="bg-gray-950 border-gray-800 mt-1"
                />
              </div>
              <div>
                <Label>Note</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional"
                  className="bg-gray-950 border-gray-800 mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                {saving ? "Saving..." : "Save Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="lg:col-span-2 bg-gray-900/90 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Deposit History</CardTitle>
              <CardDescription>
                Every GGR wallet deposit you recorded, with the live balance at
                that moment.
              </CardDescription>
            </div>
            <Button size="sm" variant="secondary" onClick={load}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Live bal. at entry</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.entries || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                      No entries yet. Start by recording your opening balance.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.entries.map((e: any) => (
                    <TableRow key={e.id} className="border-gray-800">
                      <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            e.type === "TOPUP"
                              ? "border-emerald-500/40 text-emerald-400"
                              : e.type === "OPENING"
                              ? "border-sky-500/40 text-sky-400"
                              : "border-amber-500/40 text-amber-400"
                          }
                        >
                          {e.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${
                          e.amount < 0 ? "text-rose-400" : "text-white"
                        }`}
                      >
                        {tk(e.amount)}
                      </TableCell>
                      <TableCell className="text-xs">{e.method || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {e.reference || "—"}
                        {e.note && (
                          <div className="text-[11px] text-gray-500 font-sans">
                            {e.note}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-300">
                        {tk(e.liveBalance)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {e.createdBy || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(e.id)}
                          className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <Card className="bg-gray-900/90 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent}`}>{value}</div>
        <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

