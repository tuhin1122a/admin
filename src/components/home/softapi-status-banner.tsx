"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SoftApiStatusBanner() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    fetch("/api/softapi/overview")
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => {});
  }, []);

  const ggrWallet = info?.ggr?.wallet;
  const ggrStatus = info?.ggr?.status;
  const currency = info?.config?.defaultCurrency || "BDT";
  const isConfigured = Boolean(
    info?.config?.hasToken && info?.config?.hasValidSecret
  );

  return (
    <div className="mb-4 sm:mb-6 rounded-xl border border-amber-500/20 bg-gradient-to-r from-gray-900 via-slate-900 to-amber-950/30 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-md">
      <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg sm:text-xl font-bold shrink-0">
          ♠
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 className="font-bold text-white text-xs sm:text-sm md:text-base truncate">
              Seamless SoftAPI (Slots &amp; Casino)
            </h3>
            <Badge
              variant="outline"
              className={
                ggrStatus === "OK"
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[9px] sm:text-[10px]"
                  : ggrStatus === "LOW"
                  ? "border-rose-500/40 text-rose-400 bg-rose-500/10 text-[9px] sm:text-[10px]"
                  : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[9px] sm:text-[10px]"
              }
            >
              {isConfigured
                ? ggrStatus === "OK"
                  ? "GGR WALLET ACTIVE"
                  : ggrStatus === "LOW"
                  ? "LOW GGR BALANCE"
                  : "CONNECTED"
                : "SETUP REQUIRED"}
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1 line-clamp-2">
            {ggrWallet !== null && ggrWallet !== undefined ? (
              <>
                Live GGR Billing Credit:{" "}
                <strong className="text-amber-400 font-semibold">
                  ৳ {Number(ggrWallet).toLocaleString()}
                </strong>{" "}
                • Settle Callbacks:{" "}
                <strong className="text-white font-semibold">
                  {info?.recentCallbacks?.length || 0}
                </strong>
              </>
            ) : (
              info?.ggr?.message ||
              "Manage GGR billing credit, PG/PP/JILI free rounds, providers catalog & AES-256-ECB launch settings."
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <Link href="/casino-api" className="w-full sm:w-auto">
          <Button
            size="sm"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs cursor-pointer h-8 sm:h-9"
          >
            <i className="fa-solid fa-gamepad mr-1.5"></i> Manage Casino API
          </Button>
        </Link>
      </div>
    </div>
  );
}

