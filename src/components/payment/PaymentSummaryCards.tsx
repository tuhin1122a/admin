"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

interface PaymentSummaryCardsProps {
  from?: string | Date;
  to?: string | Date;
  period?: string;
  refreshTrigger?: any;
}

export function PaymentSummaryCards({
  from,
  to,
  period = "ALL",
  refreshTrigger,
}: PaymentSummaryCardsProps) {
  const [summary, setSummary] = useState({
    totalDepositGiven: 0,
    depositGivenCount: 0,
    totalWithdrawTaken: 0,
    withdrawTakenCount: 0,
    totalManualGiven: 0,
    manualGivenCount: 0,
    totalManualTaken: 0,
    manualTakenCount: 0,
    totalBonusGiven: 0,
    bonusGivenCount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (from) {
          params.set(
            "from",
            from instanceof Date ? from.toISOString() : String(from)
          );
        }
        if (to) {
          params.set("to", to instanceof Date ? to.toISOString() : String(to));
        }
        if (period) {
          params.set("period", period);
        }
        params.set("limit", "1");

        const res = await fetch(`/api/my-statement?${params.toString()}`);
        const data = await res.json();
        if (active && res.ok && data?.success && data?.summary) {
          setSummary({
            totalDepositGiven: Number(data.summary.totalDepositGiven ?? 0),
            depositGivenCount: Number(data.summary.depositGivenCount ?? 0),
            totalWithdrawTaken: Number(data.summary.totalWithdrawTaken ?? 0),
            withdrawTakenCount: Number(data.summary.withdrawTakenCount ?? 0),
            totalManualGiven: Number(data.summary.totalManualGiven ?? 0),
            manualGivenCount: Number(data.summary.manualGivenCount ?? 0),
            totalManualTaken: Number(data.summary.totalManualTaken ?? 0),
            manualTakenCount: Number(data.summary.manualTakenCount ?? 0),
            totalBonusGiven: Number(data.summary.totalBonusGiven ?? 0),
            bonusGivenCount: Number(data.summary.bonusGivenCount ?? 0),
          });
        }
      } catch (err) {
        console.error("Failed to fetch payment summary cards:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSummary();
    return () => {
      active = false;
    };
  }, [from, to, period, refreshTrigger]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-5">
      {/* 1. Total Deposit */}
      <Card className="bg-gray-900/90 border-emerald-500/30 shadow-md">
        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
          <CardDescription className="text-[11px] sm:text-xs text-emerald-300 font-semibold flex items-center justify-between gap-1">
            <span className="truncate">Total Deposit</span>
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </CardDescription>
          <CardTitle className="text-base sm:text-xl font-extrabold text-emerald-400 font-mono truncate">
            ৳{" "}
            {summary.totalDepositGiven.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
            {loading
              ? "Updating..."
              : `${summary.depositGivenCount} Approved Deposit${
                  summary.depositGivenCount !== 1 ? "s" : ""
                }`}
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Withdraw */}
      <Card className="bg-gray-900/90 border-rose-500/30 shadow-md">
        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
          <CardDescription className="text-[11px] sm:text-xs text-rose-300 font-semibold flex items-center justify-between gap-1">
            <span className="truncate">Total Withdraw</span>
            <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
          </CardDescription>
          <CardTitle className="text-base sm:text-xl font-extrabold text-rose-400 font-mono truncate">
            ৳{" "}
            {summary.totalWithdrawTaken.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
            {loading
              ? "Updating..."
              : `${summary.withdrawTakenCount} Approved Withdraw${
                  summary.withdrawTakenCount !== 1 ? "s" : ""
                }`}
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Manual Deposit */}
      <Card className="bg-gray-900/90 border-amber-500/30 shadow-md">
        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
          <CardDescription className="text-[11px] sm:text-xs text-amber-300 font-semibold flex items-center justify-between gap-1">
            <span className="truncate">Total Manual Deposit</span>
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </CardDescription>
          <CardTitle className="text-base sm:text-xl font-extrabold text-amber-400 font-mono truncate">
            ৳{" "}
            {summary.totalManualGiven.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
            {loading
              ? "Updating..."
              : `${summary.manualGivenCount} Manual Recharge${
                  summary.manualGivenCount !== 1 ? "s" : ""
                }`}
          </p>
        </CardContent>
      </Card>

      {/* 4. Manual Withdraw */}
      <Card className="bg-gray-900/90 border-purple-500/30 shadow-md">
        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
          <CardDescription className="text-[11px] sm:text-xs text-purple-300 font-semibold flex items-center justify-between gap-1">
            <span className="truncate">Manual Withdraw</span>
            <MinusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
          </CardDescription>
          <CardTitle className="text-base sm:text-xl font-extrabold text-purple-400 font-mono truncate">
            ৳{" "}
            {summary.totalManualTaken.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
            {loading
              ? "Updating..."
              : `${summary.manualTakenCount} Manual Deduct${
                  summary.manualTakenCount !== 1 ? "s" : ""
                }`}
          </p>
        </CardContent>
      </Card>

      {/* 5. Total Bonus */}
      <Card className="bg-gray-900/90 border-cyan-500/30 shadow-md col-span-2 lg:col-span-1">
        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
          <CardDescription className="text-[11px] sm:text-xs text-cyan-300 font-semibold flex items-center justify-between gap-1">
            <span className="truncate">Total Bonus</span>
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
          </CardDescription>
          <CardTitle className="text-base sm:text-xl font-extrabold text-cyan-400 font-mono truncate">
            ৳{" "}
            {summary.totalBonusGiven.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
            {loading
              ? "Updating..."
              : `${summary.bonusGivenCount} Bonus Claim${
                  summary.bonusGivenCount !== 1 ? "s" : ""
                }`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
