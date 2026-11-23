"use client";
import { PeriodStats, SubAdminDashboardInfo } from "@/type/dashboard";
import { useState } from "react";
import { IoMdArrowUp } from "react-icons/io";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const Statistics = ({
  totalRevenue,
  activeUsers,
  bannedUsers,
  totalUsers,
  payoutsIssued,
  pendingWithdrawals,
  successDeposits,
  netAdminBalance,
  totalUserWalletBalance,
  subAdminInfo,
}: {
  totalUsers?: PeriodStats;
  activeUsers?: PeriodStats;
  bannedUsers?: PeriodStats;
  totalRevenue?: PeriodStats;
  payoutsIssued?: PeriodStats;
  pendingWithdrawals?: PeriodStats;
  successDeposits?: PeriodStats;
  netAdminBalance?: PeriodStats;
  totalUserWalletBalance?: number;
  subAdminInfo?: SubAdminDashboardInfo | null;
}) => {
  const isAgent = Boolean(subAdminInfo?.isSubAdmin);
  const commRate = subAdminInfo?.commissionRate ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-5 sm:mb-6">
      {isAgent && subAdminInfo && (
        <StatisticsCard
          data={{
            allTime: subAdminInfo.commissionEarned,
            last30Days:
              Math.round(
                Math.max(
                  0,
                  (netAdminBalance?.last30Days || 0) * (commRate / 100)
                ) * 100
              ) / 100,
            last7Days:
              Math.round(
                Math.max(
                  0,
                  (netAdminBalance?.last7Days || 0) * (commRate / 100)
                ) * 100
              ) / 100,
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-400",
            icon: "fa-solid fa-trophy",
            label: `My Commission Earned (${commRate}%)`,
          }}
        />
      )}

      {netAdminBalance && (
        <StatisticsCard
          data={{
            ...netAdminBalance,
            bgColor: "bg-yellow-500/10",
            textColor: "text-yellow-500",
            icon: "fa-solid fa-sack-dollar",
            label: isAgent
              ? "Agency Net Profit (Dep − Wd)"
              : "My Balance (Deposit − Withdraw)",
          }}
        />
      )}

      {totalUserWalletBalance !== undefined && (
        <StatisticsCard
          data={{
            allTime: totalUserWalletBalance,
            last30Days: totalUserWalletBalance,
            last7Days: totalUserWalletBalance,
            bgColor: "bg-sky-500/10",
            textColor: "text-sky-500",
            icon: "fa-solid fa-wallet",
            label: isAgent
              ? "My Players' Total Wallet Balance"
              : "Users' Total Wallet Balance",
          }}
        />
      )}

      {totalUsers && (
        <StatisticsCard
          data={{
            ...totalUsers,
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-500",
            icon: "fa-solid fa-users",
            label: isAgent ? "My Total Players" : "Total Users",
          }}
        />
      )}

      {activeUsers && (
        <StatisticsCard
          data={{
            ...activeUsers,
            bgColor: "bg-green-500/10",
            textColor: "text-green-500",
            icon: "fa-solid fa-user-check",
            label: isAgent ? "My Active Players" : "Active Users",
          }}
        />
      )}

      {bannedUsers && (
        <StatisticsCard
          data={{
            ...bannedUsers,
            bgColor: "bg-red-500/10",
            textColor: "text-red-500",
            icon: "fa-solid fa-user-slash",
            label: isAgent ? "Banned Players" : "Banned Users",
          }}
        />
      )}

      {totalRevenue && (
        <StatisticsCard
          data={{
            ...totalRevenue,
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-500",
            icon: "fa-solid fa-money-bill-wave",
            label: isAgent ? "My Players' Total Deposits" : "Total Revenue",
          }}
        />
      )}

      {payoutsIssued && (
        <StatisticsCard
          data={{
            ...payoutsIssued,
            bgColor: "bg-purple-500/10",
            textColor: "text-purple-500",
            icon: "fa-solid fa-hand-holding-dollar",
            label: isAgent
              ? "My Players' Total Withdraws"
              : "Total Payouts (Withdraws)",
          }}
        />
      )}

      {pendingWithdrawals && (
        <StatisticsCard
          data={{
            ...pendingWithdrawals,
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-500",
            icon: "fa-solid fa-clock",
            label: isAgent
              ? "Pending Player Withdrawals"
              : "Pending Withdrawals",
          }}
        />
      )}

      {successDeposits && !isAgent && (
        <StatisticsCard
          data={{
            ...successDeposits,
            bgColor: "bg-cyan-500/10",
            textColor: "text-cyan-500",
            icon: "fa-solid fa-arrow-right-to-bracket",
            label: "Success Deposits",
          }}
        />
      )}
    </div>
  );
};

export default Statistics;

const StatisticsCard = ({
  data,
}: {
  data: PeriodStats & {
    label: string;
    icon: string;
    bgColor: string;
    textColor: string;
  };
}) => {
  const [time, setTime] = useState("all");

  const { allTime, last30Days, last7Days, label, icon, bgColor, textColor } =
    data;

  const formatValue = (val: any) => {
    if (typeof val === "number") {
      return Number(val).toLocaleString(undefined, {
        minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
        maximumFractionDigits: 2,
      });
    }
    return val ?? 0;
  };

  const activeValue =
    time === "all" ? allTime : time === "month" ? last30Days : last7Days;

  return (
    <Card className="border-gray-800 bg-gray-900/90 shadow-md hover:border-gray-700 transition-all">
      <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-4 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-300 truncate max-w-[80%]">
          {label}
        </CardTitle>
        <div className={`p-2 rounded-xl shrink-0 ${bgColor}`}>
          <i className={`fa-solid ${icon} ${textColor} text-sm sm:text-base`}></i>
        </div>
      </CardHeader>
      <CardContent className="p-3.5 sm:p-4 pt-1">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
          {formatValue(activeValue)}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
          <span className="text-emerald-400 text-xs flex items-center font-medium">
            <IoMdArrowUp className="w-3.5 h-3.5 mr-0.5" /> Live
          </span>
          <Tabs
            defaultValue={time}
            onValueChange={(value) => setTime(value)}
          >
            <TabsList className="h-6 sm:h-7 bg-gray-950/80 p-0.5 border border-gray-800">
              <TabsTrigger
                value="7days"
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5"
              >
                7D
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5"
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5"
              >
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
