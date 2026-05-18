"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { useFetchDashboardQuery } from "@/lib/features/dashboardApiSlice";
import Statistics from "@/components/home/statistics";
import CookieLoader from "@/components/loaders/cookie-loader";
import DepositWithdrowChart from "@/components/home/dp-wp-chart";
import ChartFilter from "@/components/home/chart-filter";
const App: React.FC = () => {
  const [paymentChartFilter, setPaymentChartFilter] = useState("7days");

  const { data, isLoading } = useFetchDashboardQuery({
    startDate: "",
    endDate: "",
    paymentFilter: paymentChartFilter,
  });

  const [date, setDate] = useState<Date>();
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const depositsChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revenueChartRef.current) {
      const chart = echarts.init(revenueChartRef.current);
      const option = {
        animation: false,
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: ["Revenue", "Payouts"],
          textStyle: {
            color: "#ffffff",
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          axisLabel: {
            color: "#ffffff",
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            color: "#ffffff",
          },
        },
        series: [
          {
            name: "Revenue",
            type: "line",
            data: [120, 132, 101, 134, 90, 230, 210],
            smooth: true,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#10b981",
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: "rgba(16, 185, 129, 0.6)",
                },
                {
                  offset: 1,
                  color: "rgba(16, 185, 129, 0.1)",
                },
              ]),
            },
          },
          {
            name: "Payouts",
            type: "line",
            data: [82, 93, 90, 93, 129, 133, 132],
            smooth: true,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#f43f5e",
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: "rgba(244, 63, 94, 0.6)",
                },
                {
                  offset: 1,
                  color: "rgba(244, 63, 94, 0.1)",
                },
              ]),
            },
          },
        ],
      };
      chart.setOption(option);
      return () => {
        chart.dispose();
      };
    }
  }, [revenueChartRef]);

  useEffect(() => {
    if (depositsChartRef.current) {
      const chart = echarts.init(depositsChartRef.current);
      const option = {
        animation: false,
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: ["Deposits", "Withdrawals"],
          textStyle: {
            color: "#ffffff",
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          axisLabel: {
            color: "#ffffff",
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            color: "#ffffff",
          },
        },
        series: [
          {
            name: "Deposits",
            type: "bar",
            data: [320, 332, 301, 334, 390, 330, 320],
            itemStyle: {
              color: "#3b82f6",
            },
          },
          {
            name: "Withdrawals",
            type: "bar",
            data: [220, 182, 191, 234, 290, 330, 310],
            itemStyle: {
              color: "#8b5cf6",
            },
          },
        ],
      };
      chart.setOption(option);
      return () => {
        chart.dispose();
      };
    }
  }, [depositsChartRef]);

  // const recentTransactions = [
  //   {
  //     id: "TX-78945",
  //     user: "John Smith",
  //     type: "Deposit",
  //     amount: "$1,200.00",
  //     status: "Completed",
  //     date: "2025-05-19 09:23:45",
  //   },
  //   {
  //     id: "TX-78946",
  //     user: "Sarah Johnson",
  //     type: "Withdrawal",
  //     amount: "$850.00",
  //     status: "Pending",
  //     date: "2025-05-19 08:15:22",
  //   },
  //   {
  //     id: "TX-78947",
  //     user: "Michael Brown",
  //     type: "Deposit",
  //     amount: "$500.00",
  //     status: "Completed",
  //     date: "2025-05-19 07:45:10",
  //   },
  //   {
  //     id: "TX-78948",
  //     user: "Emily Davis",
  //     type: "Withdrawal",
  //     amount: "$1,500.00",
  //     status: "Failed",
  //     date: "2025-05-19 06:30:55",
  //   },
  //   {
  //     id: "TX-78949",
  //     user: "David Wilson",
  //     type: "Deposit",
  //     amount: "$2,000.00",
  //     status: "Completed",
  //     date: "2025-05-18 23:10:33",
  //   },
  //   {
  //     id: "TX-78950",
  //     user: "Jessica Taylor",
  //     type: "Withdrawal",
  //     amount: "$750.00",
  //     status: "Completed",
  //     date: "2025-05-18 22:05:17",
  //   },
  //   {
  //     id: "TX-78951",
  //     user: "James Anderson",
  //     type: "Deposit",
  //     amount: "$3,000.00",
  //     status: "Completed",
  //     date: "2025-05-18 20:45:09",
  //   },
  // ];

  return (
    <>
      {data && !isLoading && (
        <div className="  min-h-screen">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Dashboard Overview</h2>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-[240px] justify-start text-left font-normal !rounded-button whitespace-nowrap `}
                  >
                    <i className="fa-regular fa-calendar mr-2"></i>
                    {date ? (
                      format(date, "PPP")
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-auto p-0 `}>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                className={`!rounded-button whitespace-nowrap `}
              >
                <i className="fa-solid fa-filter mr-2"></i> Filter
              </Button>
              <Button
                variant="outline"
                className={`!rounded-button whitespace-nowrap `}
              >
                <i className="fa-solid fa-download mr-2"></i> Export
              </Button>
            </div>
          </div>
          {/* Stats Cards */}
          <Statistics
            totalUsers={data?.totalUsers}
            activeUsers={data?.activeUsers}
            bannedUsers={data?.bannedUsers}
            payoutsIssued={data?.payoutsIssued}
            pendingWithdrawals={data?.pendingWithdrawals}
            successDeposits={data?.successDeposits}
            totalRevenue={data?.totalRevenue}
          />
          {/* Charts Section */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Payouts (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={revenueChartRef} style={{ height: "300px" }}></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Deposits vs Withdrawals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={depositsChartRef} style={{ height: "300px" }}></div>
                </CardContent>
              </Card>
            </div> */}
          <ChartFilter
            onSelect={(value) => {
              if (value !== paymentChartFilter) {
                setPaymentChartFilter(value);
              }
            }}
            defaultValue={data.depositWithdraw.filter}
          />
          <DepositWithdrowChart
            data={data.depositWithdraw.data}
            filter={data.depositWithdraw.filter}
          />
          {/* Top Matches and Activity Feed */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Matches with Highest Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topMatches.map((match) => (
                      <div
                        key={match.id}
                        className={`p-4 rounded-lg bg-gray-800 flex justify-between items-center`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{match.teams}</h4>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <i className="fa-solid fa-users mr-1"></i>{" "}
                              {match.bettors.toLocaleString()} bettors
                            </span>
                            <span className="mx-2">•</span>
                            <span>{match.date}</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-500">
                          {match.betAmount}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className={`bg-gray-900 border-gray-800`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Live Activity Feed</CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20"
                  >
                    <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block"></span>{" "}
                    Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[340px] pr-4">
                    <div className="space-y-4">
                      {activityFeed.map((activity) => (
                        <div
                          key={activity.id}
                          className={`p-3 rounded-lg bg-gray-800`}
                        >
                          <div className="flex items-start">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className="bg-blue-500">
                                {activity.user
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p>
                                  <span className="font-medium">
                                    {activity.user}
                                  </span>{" "}
                                  {activity.action}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {activity.time}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {activity.details}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div> */}
          {/* Recent Transactions */}
          {/* <Card className={`bg-gray-900 border-gray-800`}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search transactions..."
                    className={`w-64 h-9 bg-gray-800 border-gray-700`}
                  />
                  <Select>
                    <SelectTrigger
                      className={`w-[180px] h-9 bg-gray-800 border-gray-700`}
                    >
                      <SelectValue placeholder="All Transactions" />
                    </SelectTrigger>
                    <SelectContent className={"bg-gray-800 border-gray-700"}>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="deposit">Deposits</SelectItem>
                      <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className={"border-gray-800"}>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className={"border-gray-800"}
                      >
                        <TableCell className="font-medium">
                          {transaction.id}
                        </TableCell>
                        <TableCell>{transaction.user}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.type === "Deposit"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            }
                          >
                            {transaction.type === "Deposit" ? (
                              <i className="fa-solid fa-arrow-down mr-1"></i>
                            ) : (
                              <i className="fa-solid fa-arrow-up mr-1"></i>
                            )}
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={
                            transaction.type === "Deposit"
                              ? "text-green-500 font-medium"
                              : "text-blue-500 font-medium"
                          }
                        >
                          {transaction.amount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.status === "Completed"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : transaction.status === "Pending"
                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 !rounded-button whitespace-nowrap"
                              >
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className={"bg-gray-800 border-gray-700"}
                            >
                              <DropdownMenuItem className="cursor-pointer">
                                <i className="fa-solid fa-eye mr-2"></i> View
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <i className="fa-solid fa-pen-to-square mr-2"></i>{" "}
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer text-red-500">
                                <i className="fa-solid fa-ban mr-2"></i> Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">7</span> of{" "}
                    <span className="font-medium">100</span> transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`!rounded-button whitespace-nowrap bg-gray-800 border-gray-700`}
                    >
                      <i className="fa-solid fa-chevron-left mr-2"></i> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`!rounded-button whitespace-nowrap bg-gray-800 border-gray-700`}
                    >
                      Next <i className="fa-solid fa-chevron-right ml-2"></i>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card> */}
        </div>
      )}

      {(!data || isLoading) && (
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}
    </>
  );
};
export default App;
