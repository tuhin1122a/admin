"use client";

import { format, parseISO } from "date-fns";
import { useState } from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const groupByMonth = (data: any[]) => {
  const monthlySummary: Record<
    string,
    { date: string; deposits: number; withdraws: number; revenue: number }
  > = {};

  data.forEach((item) => {
    const date = parseISO(item.date);
    const month = format(date, "yyyy-MM"); // e.g., "2025-02"

    if (!monthlySummary[month]) {
      monthlySummary[month] = {
        date: `${month}-01`, // any valid day works for chart axis
        deposits: 0,
        withdraws: 0,
        revenue: 0,
      };
    }

    monthlySummary[month].deposits += item.deposits;
    monthlySummary[month].withdraws += item.withdraws;
    monthlySummary[month].revenue += item.revenue;
  });

  return Object.values(monthlySummary);
};

const DepositWithdrawChart = ({
  data,
  filter,
}: {
  data: any[];
  filter: string;
}) => {
  const [showDeposits, setShowDeposits] = useState(true);
  const [showWithdraws, setShowWithdraws] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);

  const displayData = filter === "year" ? groupByMonth(data) : data;

  const totalDeposits = displayData.reduce(
    (acc, item) => acc + item.deposits,
    0
  );
  const totalWithdraws = displayData.reduce(
    (acc, item) => acc + item.withdraws,
    0
  );
  const totalRevenue = displayData.reduce((acc, item) => acc + item.revenue, 0);

  const formatLabel = (value: string) => {
    const date = parseISO(value);
    if (filter === "7days") return format(date, "EEE");
    if (filter === "lastMonth") return format(date, "MMM d");
    if (filter === "year") return format(date, "MMMM");
    return format(date, "PP");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div className="w-full lg:w-1/2">
        <div className="w-full p-3 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-center mb-3 capitalize text-white">
            Transaction Overview ({filter})
          </h2>
          <div className="flex justify-center gap-4 mb-3 text-xs sm:text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer text-blue-400 font-medium">
              <input
                type="checkbox"
                checked={showDeposits}
                onChange={() => setShowDeposits(!showDeposits)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Deposits
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-purple-400 font-medium">
              <input
                type="checkbox"
                checked={showWithdraws}
                onChange={() => setShowWithdraws(!showWithdraws)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              Withdraws
            </label>
          </div>
          <svg width="0" height="0">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor="#10B981"
                />
              </filter>
              <filter
                id="shadow-pink"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor="#EF4444"
                />
              </filter>
            </defs>
          </svg>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={displayData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                labelFormatter={formatLabel}
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {showDeposits && (
                <Line
                  type="monotone"
                  dataKey="deposits"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 4 }}
                  filter="url(#shadow-blue)"
                />
              )}
              {showWithdraws && (
                <Line
                  type="monotone"
                  dataKey="withdraws"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 4 }}
                  filter="url(#shadow-purple)"
                  style={{ textTransform: "capitalize" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 text-center text-xs sm:text-sm text-gray-400 font-medium pt-2 border-t border-gray-800">
            Total Deposits: <span className="text-blue-400 font-bold">৳ {Number(totalDeposits).toLocaleString()}</span> | Total Withdraws: <span className="text-purple-400 font-bold">৳ {Number(totalWithdraws).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="w-full p-3 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-center mb-3 capitalize text-white">
            Revenue Overview ({filter})
          </h2>
          <div className="flex justify-center gap-4 mb-3 text-xs sm:text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-medium">
              <input
                type="checkbox"
                checked={showRevenue}
                onChange={() => setShowRevenue(!showRevenue)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Revenue
            </label>
          </div>
          <svg width="0" height="0">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor="#10B981"
                />
              </filter>
              <filter
                id="shadow-pink"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor="#EF4444"
                />
              </filter>
            </defs>
          </svg>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={displayData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                labelFormatter={formatLabel}
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {showRevenue && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 4 }}
                  filter="url(#shadow-blue)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-3 text-center text-xs sm:text-sm text-gray-400 font-medium pt-2 border-t border-gray-800">
            Net Revenue: <span className="text-emerald-400 font-bold">৳ {Number(totalRevenue).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositWithdrawChart;
