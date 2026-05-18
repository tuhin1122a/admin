"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
// import * as echarts from "echarts";
import {
  useFetchUserQuery,
  useSuspensionMutation,
} from "@/lib/features/usersApiSlice";
import CookieLoader from "@/components/loaders/cookie-loader";
import moment from "moment";
import Link from "next/link";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";

import { FadeLoader } from "react-spinners";

const Details = ({ userId }: { userId: string }) => {
  const { data, isLoading } = useFetchUserQuery({ id: userId });

  const user = data?.user;
  const financialOverview = data?.financialOverview;
  const bettingStatistics = data?.bettingStatistics;
  const latestTransactions = data?.latestTransactions;

  const [suspensionApi, { isLoading: suspensionLoading }] =
    useSuspensionMutation();

  const [rechargeAmount, setRechargeAmount] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Initialize chart
  // React.useEffect(() => {
  //   const chartDom = document.getElementById("bettingChart");
  //   if (chartDom) {
  //     const myChart = echarts.init(chartDom);
  //     const option = {
  //       animation: false,
  //       tooltip: {
  //         trigger: "item",
  //       },
  //       color: ["#10B981", "#EF4444"],
  //       series: [
  //         {
  //           name: "Betting Results",
  //           type: "pie",
  //           radius: ["40%", "70%"],
  //           avoidLabelOverlap: false,
  //           itemStyle: {
  //             borderRadius: 10,
  //             borderColor: "#2D2D2D",
  //             borderWidth: 2,
  //           },
  //           label: {
  //             show: false,
  //             position: "center",
  //           },
  //           emphasis: {
  //             label: {
  //               show: true,
  //               fontSize: 16,
  //               fontWeight: "bold",
  //               color: "#ffffff",
  //             },
  //           },
  //           labelLine: {
  //             show: false,
  //           },
  //           data: [
  //             { value: 100, name: "Wins" },
  //             { value: 435, name: "Losses" },
  //           ],
  //         },
  //       ],
  //     };
  //     myChart.setOption(option);

  //     // Resize chart on window resize
  //     window.addEventListener("resize", () => {
  //       myChart.resize();
  //     });

  //     return () => {
  //       myChart.dispose();
  //       window.removeEventListener("resize", () => {
  //         myChart.resize();
  //       });
  //     };
  //   }
  // }, []);

  const handleRecharge = () => {
    alert(`Recharging ${rechargeAmount} via ${paymentMethod}`);
    setRechargeAmount("");
    setPaymentMethod("");
  };

  const handleSendNotification = () => {
    alert(`Notification sent: ${notificationMessage}`);
    setNotificationMessage("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  const handleSuspension = () => {
    const actionType = user?.isBanned ? "UNBAN" : "BAN";

    suspensionApi({ actionType, id: user!.id })
      .unwrap()
      .then((res) => {
        if (res.success) {
          // success
        }
      })
      .catch((error: any) => {
        if (error.data.error) {
          toast.error(error.data.error);
        } else {
          toast.error(INTERNAL_SERVER_ERROR);
        }
      });
  };

  return (
    <div>
      {data && !isLoading && (
        <div>
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                User Details
                <Badge
                  className={`ml-2 ${
                    user!.isBanned ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  {user?.isBanned ? "Banned" : "Active"}
                </Badge>
              </h2>
              <p className="text-xl text-[#9CA3AF]">
                Player ID: {user?.playerId}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSuspension}
                variant={suspensionLoading ? "outline" : "destructive"}
                className={`!rounded-button flex items-center whitespace-nowrap cursor-pointer ${
                  user!.isBanned &&
                  !suspensionLoading &&
                  "!bg-emerald-600 hover:!bg-emerald-700"
                }`}
              >
                {!suspensionLoading && (
                  <i
                    className={`fas ${
                      user!.isBanned ? "fa-user-check" : "fa-user-slash"
                    } mr-2`}
                  ></i>
                )}

                {suspensionLoading && (
                  <FadeLoader
                    color="#fff"
                    cssOverride={{ scale: 0.4, marginTop: "-25px" }}
                  />
                )}

                {user!.isBanned ? "Unban User" : "Ban User"}
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("notification-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="!rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-bell mr-2"></i>
                Notify
              </Button>

              <Button
                variant="default"
                onClick={() =>
                  document
                    .getElementById("recharge-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-[#007AFF] hover:bg-[#0056b3] !rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-wallet mr-2"></i>
                Recharge
              </Button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-primary border-gray-800 col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={""} />
                    <AvatarFallback className="text-2xl">US</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold">{user?.playerId}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Phone:</span>
                    <span>{user?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Joined:</span>
                    <span>{moment(user?.createdAt).calendar()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Status:</span>
                    <span
                      className={
                        user!.isBanned ? "text-red-500" : "text-green-500"
                      }
                    >
                      {user!.isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Current Balance:</span>
                    <span className="font-bold text-[#007AFF]">
                      {+user!.wallet!.balance}
                    </span>
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Referrer ID:</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/users/${user!.invitedById}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Refer Code:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{user!.referId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user!.referId)}
                        className="h-6 w-6 p-0 !rounded-button cursor-pointer"
                      >
                        <i className="fas fa-copy text-xs"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary border-gray-800 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-[#1A2231] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Deposit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.totalDeposits}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A2231] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Withdraw</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.totalWithdraws}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A2231] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Last Deposit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.lastDeposits}
                      </p>
                      <p className="text-sm text-[#9CA3AF]">
                        {financialOverview!.lastWithdraws}
                        Today
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A2231] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Last Withdraw</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.lastWithdraws}
                      </p>
                      <p className="text-sm text-[#9CA3AF]">Today</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Betting Statistics */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Betting Statistics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="bg-primary border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {bettingStatistics?.totalBet}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Wins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    {bettingStatistics?.totalWin}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Losses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {bettingStatistics?.totalLosss}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#007AFF]">
                    {bettingStatistics?.winRate}%
                  </p>
                  <Progress
                    value={bettingStatistics?.winRate}
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Betting Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-primary border-gray-800">
              <CardHeader>
                <CardTitle>Betting Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="bettingChart" className="h-[300px]"></div>
              </CardContent>
            </Card>

            {/* Action Panel */}
            <div className="space-y-6">
              {/* Recharge Section */}
              <Card
                className="bg-primary border-gray-800"
                id="recharge-section"
              >
                <CardHeader>
                  <CardTitle>Recharge Wallet</CardTitle>
                  <CardDescription className="text-[#9CA3AF]">
                    Add funds to user&apos;s account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="Enter amount"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="bg-[#2D2D2D] border-gray-800 focus:border-[#007AFF] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Textarea
                        id="message"
                        placeholder="Enter your message here"
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        className=" border-gray-800 focus:border-[#007AFF] text-white min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleRecharge}
                    className="w-full bg-[#007AFF] hover:bg-[#0056b3] !rounded-button whitespace-nowrap cursor-pointer"
                    disabled={!rechargeAmount || !paymentMethod}
                  >
                    <i className="fas fa-plus-circle mr-2"></i>
                    Add Balance
                  </Button>
                </CardFooter>
              </Card>

              {/* Notification Section */}
              <Card
                className="bg-primary border-gray-800"
                id="notification-section"
              >
                <CardHeader>
                  <CardTitle>Send Notification</CardTitle>
                  <CardDescription className="text-[#9CA3AF]">
                    Send a message to this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Enter your message here"
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        className=" border-gray-800 focus:border-[#007AFF] text-white min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSendNotification}
                    className="w-full bg-[#007AFF] hover:bg-[#0056b3] !rounded-button whitespace-nowrap cursor-pointer"
                    disabled={!notificationMessage}
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Notification
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Recent Transactions */}
          <Card className={`bg-gray-900 border-gray-800`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className={"border-gray-800"}>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date/Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestTransactions?.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className={"border-gray-800"}
                    >
                      <TableCell className="font-medium">
                        {transaction.amount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            transaction.type === "deposit"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          }
                        >
                          {transaction.type === "deposit" ? (
                            <i className="fa-solid fa-arrow-down mr-1"></i>
                          ) : (
                            <i className="fa-solid fa-arrow-up mr-1"></i>
                          )}
                          {transaction.type}
                        </Badge>
                      </TableCell>

                      <TableCell className="capitalize">
                        <Badge
                          variant="outline"
                          className={
                            transaction.status === "APPROVED"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : transaction.status === "PENDING"
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {moment(transaction.createdAt).calendar()}
                      </TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium">
                    {latestTransactions?.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(!data || isLoading) && (
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}
    </div>
  );
};

export default Details;
