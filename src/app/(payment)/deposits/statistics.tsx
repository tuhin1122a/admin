"use client";
import React, { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import * as echarts from "echarts";

interface Deposit {
  id: string;
  trackingId: string;
  userId: string;
  amount: number;
  paymentGateway: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  userEmail: string;
  userName: string;
  userPhone: string;
  notes: string;
  paymentMethod: string;
  accountDetails: string;
}

// Sample data
const deposits: Deposit[] = [
  {
    id: "TRX-78945612",
    trackingId: "PAY-123456",
    userId: "USER-7890",
    amount: 250.0,
    paymentGateway: "PayPal",
    timestamp: "2025-05-19 14:30:22",
    status: "pending",
    userEmail: "john.doe@example.com",
    userName: "John Doe",
    userPhone: "+1 (555) 123-4567",
    notes: "First deposit",
    paymentMethod: "Credit Card",
    accountDetails: "XXXX-XXXX-XXXX-4567",
  },
  {
    id: "TRX-78945613",
    trackingId: "PAY-123457",
    userId: "USER-7891",
    amount: 500.0,
    paymentGateway: "Stripe",
    timestamp: "2025-05-19 13:15:45",
    status: "pending",
    userEmail: "jane.smith@example.com",
    userName: "Jane Smith",
    userPhone: "+1 (555) 987-6543",
    notes: "VIP customer",
    paymentMethod: "Debit Card",
    accountDetails: "XXXX-XXXX-XXXX-9876",
  },
  {
    id: "TRX-78945614",
    trackingId: "PAY-123458",
    userId: "USER-7892",
    amount: 100.0,
    paymentGateway: "Skrill",
    timestamp: "2025-05-19 12:05:33",
    status: "approved",
    userEmail: "robert.johnson@example.com",
    userName: "Robert Johnson",
    userPhone: "+1 (555) 456-7890",
    notes: "Regular customer",
    paymentMethod: "E-Wallet",
    accountDetails: "robert.j@skrill.com",
  },
  {
    id: "TRX-78945615",
    trackingId: "PAY-123459",
    userId: "USER-7893",
    amount: 750.0,
    paymentGateway: "Neteller",
    timestamp: "2025-05-19 10:45:18",
    status: "rejected",
    userEmail: "emily.wilson@example.com",
    userName: "Emily Wilson",
    userPhone: "+1 (555) 789-0123",
    notes: "Payment verification failed",
    paymentMethod: "E-Wallet",
    accountDetails: "emily.w@neteller.com",
  },
  {
    id: "TRX-78945616",
    trackingId: "PAY-123460",
    userId: "USER-7894",
    amount: 300.0,
    paymentGateway: "Bitcoin",
    timestamp: "2025-05-19 09:30:55",
    status: "pending",
    userEmail: "michael.brown@example.com",
    userName: "Michael Brown",
    userPhone: "+1 (555) 234-5678",
    notes: "Crypto deposit",
    paymentMethod: "Cryptocurrency",
    accountDetails: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5",
  },
  {
    id: "TRX-78945617",
    trackingId: "PAY-123461",
    userId: "USER-7895",
    amount: 450.0,
    paymentGateway: "Visa",
    timestamp: "2025-05-18 16:20:10",
    status: "approved",
    userEmail: "sarah.davis@example.com",
    userName: "Sarah Davis",
    userPhone: "+1 (555) 345-6789",
    notes: "Premium account",
    paymentMethod: "Credit Card",
    accountDetails: "XXXX-XXXX-XXXX-1234",
  },
  {
    id: "TRX-78945618",
    trackingId: "PAY-123462",
    userId: "USER-7896",
    amount: 200.0,
    paymentGateway: "MasterCard",
    timestamp: "2025-05-18 15:10:42",
    status: "rejected",
    userEmail: "david.miller@example.com",
    userName: "David Miller",
    userPhone: "+1 (555) 456-7890",
    notes: "Insufficient funds",
    paymentMethod: "Credit Card",
    accountDetails: "XXXX-XXXX-XXXX-5678",
  },
];

const Statistics: React.FC = () => {
  const [statsDateFilter, setStatsDateFilter] = useState<string>("today");

  // Stats for cards
  const stats = useMemo(() => ({
    totalRequests: deposits.length,
    approved: deposits.filter((d) => d.status === "approved").length,
    rejected: deposits.filter((d) => d.status === "rejected").length,
    pending: deposits.filter((d) => d.status === "pending").length,
  }), []);

  // Initialize chart after component mounts
  React.useEffect(() => {
    const chartDom = document.getElementById("deposits-chart");
    if (chartDom) {
      const myChart = echarts.init(chartDom);
      const option = {
        animation: false,
        tooltip: {
          trigger: "item",
        },
        legend: {
          top: "5%",
          left: "center",
        },
        series: [
          {
            name: "Deposits Status",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              {
                value: stats.approved,
                name: "Approved",
                itemStyle: { color: "#10b981" },
              },
              {
                value: stats.rejected,
                name: "Rejected",
                itemStyle: { color: "#ef4444" },
              },
              {
                value: stats.pending,
                name: "Pending",
                itemStyle: { color: "#f59e0b" },
              },
            ],
          },
        ],
      };
      myChart.setOption(option);

      // Cleanup
      return () => {
        myChart.dispose();
      };
    }
  }, [stats]);

  return (
    <>
      <div className="">
        {/* Header */}
        <header className=" shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold ">Deposits Management</h1>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="!rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i className="fas fa-download mr-2"></i>
                  Export Data
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button whitespace-nowrap cursor-pointer">
                  <i className="fas fa-sync-alt mr-2"></i>
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Deposits
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 !rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setStatsDateFilter("today")}
                      >
                        Today
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatsDateFilter("week")}
                      >
                        This Week
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatsDateFilter("month")}
                      >
                        This Month
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatsDateFilter("year")}
                      >
                        This Year
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold">
                    {stats.totalRequests}
                  </div>
                  <div className="ml-2 text-sm text-green-500 font-medium">
                    <i className="fas fa-arrow-up mr-1"></i>
                    12%
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {statsDateFilter === "today"
                    ? "Today"
                    : statsDateFilter === "week"
                    ? "This Week"
                    : statsDateFilter === "month"
                    ? "This Month"
                    : "This Year"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Approved Deposits
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 !rounded-button whitespace-nowrap cursor-pointer"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.approved}
                  </div>
                  <div className="ml-2 text-sm text-green-500 font-medium">
                    <i className="fas fa-arrow-up mr-1"></i>
                    8%
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {statsDateFilter === "today"
                    ? "Today"
                    : statsDateFilter === "week"
                    ? "This Week"
                    : statsDateFilter === "month"
                    ? "This Month"
                    : "This Year"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Rejected Deposits
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 !rounded-button whitespace-nowrap cursor-pointer"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold text-red-600">
                    {stats.rejected}
                  </div>
                  <div className="ml-2 text-sm text-red-500 font-medium">
                    <i className="fas fa-arrow-down mr-1"></i>
                    3%
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {statsDateFilter === "today"
                    ? "Today"
                    : statsDateFilter === "week"
                    ? "This Week"
                    : statsDateFilter === "month"
                    ? "This Month"
                    : "This Year"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Pending Deposits
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 !rounded-button whitespace-nowrap cursor-pointer"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold text-yellow-500">
                    {stats.pending}
                  </div>
                  <div className="ml-2 text-sm text-yellow-500 font-medium">
                    <i className="fas fa-minus mr-1"></i>
                    0%
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {statsDateFilter === "today"
                    ? "Today"
                    : statsDateFilter === "week"
                    ? "This Week"
                    : statsDateFilter === "month"
                    ? "This Month"
                    : "This Year"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart and Tabs Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Deposits Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="deposits-chart" className="h-80"></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Approval Rate</span>
                  <span className="text-green-600 font-bold">
                    {Math.round((stats.approved / stats.totalRequests) * 100)}%
                  </span>
                </div>
                <div className="w-full rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{
                      width: `${Math.round(
                        (stats.approved / stats.totalRequests) * 100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm font-medium">Rejection Rate</span>
                  <span className="text-red-600 font-bold">
                    {Math.round((stats.rejected / stats.totalRequests) * 100)}%
                  </span>
                </div>
                <div className="w-full  rounded-full h-2.5">
                  <div
                    className="bg-red-600 h-2.5 rounded-full"
                    style={{
                      width: `${Math.round(
                        (stats.rejected / stats.totalRequests) * 100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm font-medium">Pending Rate</span>
                  <span className="text-yellow-500 font-bold">
                    {Math.round((stats.pending / stats.totalRequests) * 100)}%
                  </span>
                </div>
                <div className="w-full  rounded-full h-2.5">
                  <div
                    className="bg-yellow-500 h-2.5 rounded-full"
                    style={{
                      width: `${Math.round(
                        (stats.pending / stats.totalRequests) * 100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Amount</span>
                    <span className="font-bold">
                      $
                      {(
                        deposits.reduce(
                          (sum, deposit) => sum + deposit.amount,
                          0
                        ) / deposits.length
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default Statistics;
