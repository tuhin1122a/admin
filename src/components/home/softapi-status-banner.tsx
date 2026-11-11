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
    <div className="mb-6 rounded-xl border border-amber-500/20 bg-gradient-to-r from-gray-900 via-slate-900 to-amber-950/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start md:items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-bold shrink-0">
          ♠
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white text-sm md:text-base">
              Seamless SoftAPI (Slots, Live Casino & Sports)
            </h3>
            <Badge
              variant="outline"
              className={
                ggrStatus === "OK"
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                  : ggrStatus === "LOW"
                  ? "border-rose-500/40 text-rose-400 bg-rose-500/10 text-[10px]"
                  : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
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
          <p className="text-xs text-gray-400 mt-0.5">
            {ggrWallet !== null && ggrWallet !== undefined ? (
              <>
                Live GGR Billing Credit:{" "}
                <strong className="text-amber-400">
                  ৳ {Number(ggrWallet).toLocaleString()}
                </strong>{" "}
                • Settle Callbacks:{" "}
                <strong className="text-white">
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

      <div className="flex items-center gap-2 shrink-0">
        <Link href="/casino-api">
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            Manage Casino API
          </Button>
        </Link>
      </div>
    </div>
  );
}

