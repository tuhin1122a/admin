"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AgentPayDownloadBanner() {
  return (
    <div className="mb-4 sm:mb-6 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 p-3.5 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl sm:text-2xl shrink-0">
            <i className="fa-brands fa-android"></i>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                RK444 Agent Pay — SMS Auto-Deposit App
              </h3>
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px] sm:text-xs">
                v1.0.2
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-[10px] sm:text-xs"
              >
                Mother Admin Only
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-1 line-clamp-2">
              Auto-reads bKash / Nagad / Rocket / Upay Receive Money &amp; Cash In SMS, credits exact received amount, prevents duplicate TrxID reuse, and sends instant withdraw push alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a
            href="/api/agent-pay-apk"
            download="RK444-Agent-Pay-v1.0.2.apk"
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 cursor-pointer h-8 sm:h-9">
              <i className="fa-solid fa-download mr-1.5 sm:mr-2"></i>
              Download Agent Pay APK
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
