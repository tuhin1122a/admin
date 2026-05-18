"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

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
    <div className="flex gap-3">
      <div className="w-full md:w-1/2">
        <div className="w-full max-w-5xl mx-auto p-2 py-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold text-center mb-4 capitalize">
            Transaction Overview ({filter})
          </h2>
          <div className="flex justify-center gap-4 mb-4">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showDeposits}
                onChange={() => setShowDeposits(!showDeposits)}
              />
              Deposits
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showWithdraws}
                onChange={() => setShowWithdraws(!showWithdraws)}
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
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={formatLabel}
                contentStyle={{ background: "#101828" }}
              />
              <Legend />
              {showDeposits && (
                <Line
                  type="monotone"
                  dataKey="deposits"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  filter="url(#shadow-blue)"
                />
              )}
              {showWithdraws && (
                <Line
                  type="monotone"
                  dataKey="withdraws"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  filter="url(#shadow-purple)"
                  style={{ textTransform: "capitalize" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
            Total Deposits: {totalDeposits} | Total Withdraws: {totalWithdraws}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2">
        <div className="w-full max-w-5xl mx-auto p-2 py-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold text-center mb-4 capitalize">
            Revenue Overview ({filter})
          </h2>
          <div className="flex justify-center gap-4 mb-4">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showRevenue}
                onChange={() => setShowRevenue(!showRevenue)}
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

          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={formatLabel}
                contentStyle={{ background: "#101828" }}
              />
              <Legend />
              {showRevenue && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  filter="url(#shadow-blue)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
            Total Deposits: {totalRevenue}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositWithdrawChart;
