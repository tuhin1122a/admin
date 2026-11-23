"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubAdminDashboardInfo } from "@/type/dashboard";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface SubAdminHeaderProps {
  info: SubAdminDashboardInfo;
}

export default function SubAdminHeader({ info }: SubAdminHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!info?.referralLink) return;
    navigator.clipboard.writeText(info.referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-5 sm:mb-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-3.5 sm:p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Agent Info */}
        <div className="flex items-start gap-3 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl sm:text-2xl font-bold shrink-0">
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">Agency Dashboard</h2>
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-mono text-[11px] sm:text-xs">
                Code: {info.agentCode}
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-[11px] sm:text-xs"
              >
                {info.commissionRate}% Commission
              </Badge>
              <Badge
                variant="outline"
                className={
                  info.myBankingCount > 0
                    ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-[11px] sm:text-xs"
                    : "border-rose-500/40 text-rose-300 bg-rose-500/10 text-[11px] sm:text-xs"
                }
              >
                {info.myBankingCount > 0
                  ? `${info.myBankingCount} Active Numbers`
                  : "No Numbers Set"}
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-1 line-clamp-2">
              Share your referral link to onboard players. All deposits and withdrawals made by your players will be credited to your agency.
            </p>
          </div>
        </div>

        {/* Right: Quick actions - 2x2 grid on mobile, flex on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          <Link href="/add-banking" className="w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs cursor-pointer h-8"
            >
              <i className="fa-solid fa-mobile-screen mr-1.5"></i> My Numbers
            </Button>
          </Link>
          <Link href="/users" className="w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs cursor-pointer h-8"
            >
              <i className="fa-solid fa-users mr-1.5"></i> My Players
            </Button>
          </Link>
          <Link href="/deposits" className="w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs cursor-pointer h-8"
            >
              <i className="fa-solid fa-arrow-down mr-1.5"></i> Deposits
            </Button>
          </Link>
          <Link href="/withdraws" className="w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs cursor-pointer h-8"
            >
              <i className="fa-solid fa-arrow-up mr-1.5"></i> Withdraws
            </Button>
          </Link>
        </div>
      </div>

      {/* Referral Link Bar */}
      <div className="mt-3.5 pt-3.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/40 -mx-3.5 sm:-mx-5 -mb-3.5 sm:-mb-5 p-3 sm:p-4 rounded-b-2xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <i className="fa-solid fa-link text-blue-400"></i> Referral Link:
          </span>
          <code className="text-[11px] sm:text-xs bg-black/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 font-mono text-blue-300 truncate select-all flex-1">
            {info.referralLink}
          </code>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleCopy}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer h-8"
          >
            <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"} mr-1.5`}></i>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const text = `Join now using my referral link: ${info.referralLink}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="text-emerald-400 hover:bg-emerald-500/10 text-xs cursor-pointer h-8 w-8 p-0"
            title="Share via WhatsApp"
          >
            <i className="fa-brands fa-whatsapp text-sm"></i>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(
                  info.referralLink
                )}&text=${encodeURIComponent("Join now using my referral link!")}`,
                "_blank"
              );
            }}
            className="text-sky-400 hover:bg-sky-500/10 text-xs cursor-pointer h-8 w-8 p-0"
            title="Share via Telegram"
          >
            <i className="fa-brands fa-telegram text-sm"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
