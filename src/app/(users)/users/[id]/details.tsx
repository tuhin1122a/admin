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
  useUpdateSigninBonusMutation,
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
  const betHistory = data?.betHistory;
  const [betFilter, setBetFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");

  const [suspensionApi, { isLoading: suspensionLoading }] =
    useSuspensionMutation();
  const [updateSigninBonus, { isLoading: toggleLoading }] =
    useUpdateSigninBonusMutation();

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

  const handleToggleSigninBonus = () => {
    if (!user) return;
    const nextStatus = !user.wallet?.signinBonus;
    updateSigninBonus({ id: user.id, signinBonus: nextStatus })
      .unwrap()
      .then((res) => {
        if (res.success) {
          toast.success(`First deposit bonus has been ${nextStatus ? "activated" : "deactivated"} for this user.`);
        }
      })
      .catch((error: any) => {
        if (error?.data?.error) {
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
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#9CA3AF]">First Deposit Bonus:</span>
                    <div className="flex items-center gap-1.5">
                      {financialOverview?.approvedDepositsCount === 0 ? (
                        <Badge className="bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600/20 text-[10px] px-1.5 py-0.5">
                          Active (New User)
                        </Badge>
                      ) : user?.wallet?.signinBonus ? (
                        <Badge className="bg-blue-600/20 text-blue-500 border border-blue-500/30 hover:bg-blue-600/20 text-[10px] px-1.5 py-0.5">
                          Active (Override)
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 text-[10px] px-1.5 py-0.5">
                          Inactive
                        </Badge>
                      )}
                      {(financialOverview?.approvedDepositsCount ?? 0) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={toggleLoading}
                          onClick={handleToggleSigninBonus}
                          className="h-5 px-1.5 text-[9px] uppercase font-bold border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white !rounded cursor-pointer"
                        >
                          {user?.wallet?.signinBonus ? "Disable" : "Enable"}
                        </Button>
                      )}
                    </div>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Casino Betting Overview</h3>
                <p className="text-xs text-gray-400">Total turnover, winnings and player performance metrics</p>
              </div>
              <Link href="/casino-api">
                <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs">
                  Give Free Spins (PG/PP/JILI)
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Bets (Stake)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono text-amber-400">
                    ৳ {Number(bettingStatistics?.totalBet ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Total wagered amount</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Wins (Payout)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono text-emerald-400">
                    ৳ {Number(bettingStatistics?.totalWin ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Returned to player</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Casino Net P/L</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const net = Number(bettingStatistics?.totalBet ?? 0) - Number(bettingStatistics?.totalWin ?? 0);
                    return (
                      <>
                        <p className={`text-2xl font-bold font-mono ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {net >= 0 ? "+" : ""}৳ {net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {net >= 0 ? "Casino Profit from user" : "Casino Loss to user"}
                        </p>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono text-sky-400">
                    {bettingStatistics?.winRate ?? 0}%
                  </p>
                  <Progress
                    value={Math.min(bettingStatistics?.winRate ?? 0, 100)}
                    className="h-2 mt-2 bg-gray-800"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Casino Bet History (Round-by-Round Breakdown) */}
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg text-white">Casino Bet History (Game & Round Details)</CardTitle>
                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                    {betHistory?.length ?? 0} Rounds Logged
                  </Badge>
                </div>
                <CardDescription className="text-gray-400 mt-0.5 text-xs">
                  Per-round game sessions, stakes, multipliers, and balance reconciliation from Seamless SoftAPI.
                </CardDescription>
              </div>

              {/* Bet filter buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={betFilter === "ALL" ? "default" : "outline"}
                  onClick={() => setBetFilter("ALL")}
                  className={`text-xs h-7 px-3 ${betFilter === "ALL" ? "bg-amber-500 text-black font-semibold" : "border-gray-700 bg-gray-800"}`}
                >
                  All Bets
                </Button>
                <Button
                  size="sm"
                  variant={betFilter === "WIN" ? "default" : "outline"}
                  onClick={() => setBetFilter("WIN")}
                  className={`text-xs h-7 px-3 ${betFilter === "WIN" ? "bg-emerald-600 text-white font-semibold" : "border-gray-700 bg-gray-800 text-emerald-400"}`}
                >
                  Wins Only
                </Button>
                <Button
                  size="sm"
                  variant={betFilter === "LOSS" ? "default" : "outline"}
                  onClick={() => setBetFilter("LOSS")}
                  className={`text-xs h-7 px-3 ${betFilter === "LOSS" ? "bg-rose-600 text-white font-semibold" : "border-gray-700 bg-gray-800 text-rose-400"}`}
                >
                  Losses Only
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-gray-300">Round ID / Serial</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Game & Provider</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Stake (Bet)</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Multiplier</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Payout (Win)</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Result</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Balance After</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300 text-right">Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filteredBets = (betHistory || []).filter((b) => {
                        if (betFilter === "WIN") return b.status === "WIN";
                        if (betFilter === "LOSS") return b.status === "LOSS";
                        return true;
                      });

                      if (filteredBets.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-10 text-gray-500 text-sm">
                              No betting history recorded for this user yet. When the user plays games (Aviator, Slots, Live Casino), each bet/settle round will automatically appear here!
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredBets.map((bet, idx) => (
                        <TableRow key={idx} className="border-gray-800 hover:bg-gray-800/40">
                          {/* Round ID */}
                          <TableCell className="font-mono text-xs">
                            <span className="text-white font-semibold" title={bet.serialNumber}>
                              #{bet.gameRound || bet.serialNumber.slice(0, 16)}
                            </span>
                            {bet.freeSpinBonus && (
                              <Badge className="ml-1.5 bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] px-1 py-0">
                                Spin: {bet.freeSpinBonus}
                              </Badge>
                            )}
                          </TableCell>

                          {/* Game Info */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-white text-xs">{bet.gameName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">UID: {bet.gameUid}</span>
                            </div>
                          </TableCell>

                          {/* Stake */}
                          <TableCell className="font-mono font-semibold text-amber-400 text-xs">
                            ৳ {bet.betAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>

                          {/* Multiplier */}
                          <TableCell className="font-mono text-xs">
                            <span className={bet.multiplier > 1 ? "text-emerald-400 font-bold" : "text-gray-400"}>
                              {bet.multiplier > 0 ? `${bet.multiplier.toFixed(2)}x` : "0.00x"}
                            </span>
                          </TableCell>

                          {/* Payout */}
                          <TableCell className="font-mono font-semibold text-xs">
                            <span className={bet.winAmount > 0 ? "text-emerald-400" : "text-gray-500"}>
                              ৳ {bet.winAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>

                          {/* Result */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-semibold ${
                                bet.status === "WIN"
                                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                  : bet.status === "REFUND"
                                  ? "border-sky-500/40 text-sky-400 bg-sky-500/10"
                                  : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                              }`}
                            >
                              {bet.status}
                            </Badge>
                          </TableCell>

                          {/* Balance After */}
                          <TableCell className="font-mono text-xs text-gray-300">
                            ৳ {bet.creditAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>

                          {/* Date & Time */}
                          <TableCell className="text-right text-xs text-gray-400 whitespace-nowrap">
                            {moment(bet.createdAt).format("DD MMM, hh:mm:ss A")}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recharge Section */}
            <Card className="bg-primary border-gray-800" id="recharge-section">
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
