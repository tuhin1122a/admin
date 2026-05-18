"use client";
import { PeriodStats } from "@/type/dashboard";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { IoMdArrowUp } from "react-icons/io";

const Statistics = ({
  totalRevenue,
  activeUsers,
  bannedUsers,
  totalUsers,
  payoutsIssued,
  pendingWithdrawals,
  successDeposits,
}: {
  totalUsers?: PeriodStats;
  activeUsers?: PeriodStats;
  bannedUsers?: PeriodStats;
  totalRevenue?: PeriodStats;
  payoutsIssued?: PeriodStats;
  pendingWithdrawals?: PeriodStats;
  successDeposits?: PeriodStats;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {totalUsers && (
        <StatisticsCard
          data={{
            ...totalUsers,
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-500",
            icon: "fa-solid fa-users",
            label: "Total Users",
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
            label: "Active Users",
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
            label: "Banned Users",
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
            label: "Total Revenue",
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
            label: "Total Revenue",
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
            label: "Total Revenue",
          }}
        />
      )}

      {successDeposits && (
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className={`p-2 rounded-full  ${bgColor}`}>
          <i className={`fa-solid ${icon} ${textColor}`}></i>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {time == "all" ? allTime : time == "month" ? last30Days : last7Days}
        </div>
        <div className="flex items-center mt-1">
          <span className={"text-green-500 flex items-center"}>
            <IoMdArrowUp className="w-4 h-4 mr-1" /> 0
          </span>
          <Tabs
            defaultValue={time}
            className="ml-auto"
            onValueChange={(value) => setTime(value)}
          >
            <TabsList className={`h-7 `}>
              <TabsTrigger value="7days" className="text-xs px-2 py-0 h-5">
                7 Days
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2 py-0 h-5">
                Month
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2 py-0 h-5">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
