"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { GameSessionItem } from "@/type/user";
// import * as echarts from "echarts";
import CookieLoader from "@/components/loaders/cookie-loader";
import { INTERNAL_SERVER_ERROR } from "@/error";
import {
    useFetchUserQuery,
    useSuspensionMutation,
    useUpdateSigninBonusMutation,
} from "@/lib/features/usersApiSlice";
import moment from "moment";
import Link from "next/link";
import { toast } from "sonner";

import { addBalanceToUsers } from "@/action/add-balance";
import { ManualWithdrawModal } from "@/components/user/ManualWithdrawModal";
import { UserPasswordModal } from "@/components/user/UserPasswordModal";
import { UserRestrictionsModal } from "@/components/user/UserRestrictionsModal";
import { FadeLoader } from "react-spinners";

const Details = ({ userId }: { userId: string }) => {
  const { data, isLoading, refetch } = useFetchUserQuery({ id: userId });

  const user = data?.user;
  const financialOverview = data?.financialOverview;
  const bettingStatistics = data?.bettingStatistics;
  const latestTransactions = data?.latestTransactions;
  const betHistory = data?.betHistory;
  const bonusBreakdown = data?.bonusBreakdown;
  const balanceAudit = data?.balanceAudit;
  const gameSessions = data?.gameSessions;
  const [betFilter, setBetFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");

  const [selectedSession, setSelectedSession] = useState<GameSessionItem | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionRounds, setSessionRounds] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionRoundFilter, setSessionRoundFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");

  // User Passwords, Restrictions & Manual Withdraw Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRestrictionsModalOpen, setIsRestrictionsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeMessage, setRechargeMessage] = useState("");

  const handleOpenSessionDetails = async (session: GameSessionItem) => {
    setSelectedSession(session);
    setIsSessionModalOpen(true);
    setSessionLoading(true);
    setSessionRounds([]);
    try {
      const res = await fetch(`/api/softapi/sessions/${session.id}/rounds`);
      const result = await res.json();
      if (result.success) {
        setSessionRounds(result.rounds || []);
      } else {
        toast.error(result.message || "Failed to load session rounds");
      }
    } catch {
      toast.error("Failed to fetch session rounds from API");
    } finally {
      setSessionLoading(false);
    }
  };

  const [suspensionApi, { isLoading: suspensionLoading }] =
    useSuspensionMutation();
  const [updateSigninBonus, { isLoading: toggleLoading }] =
    useUpdateSigninBonusMutation();

  const [rechargeAmount, setRechargeAmount] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationIcon, setNotificationIcon] = useState("INFO");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [loadingUserNotifications, setLoadingUserNotifications] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  const fetchUserNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingUserNotifications(true);
      const res = await fetch(`/api/notifications?userId=${userId}&limit=10`);
      const result = await res.json();
      if (result?.notifications) {
        setUserNotifications(result.notifications);
      }
    } catch {
      // ignore
    } finally {
      setLoadingUserNotifications(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserNotifications();
  }, [fetchUserNotifications]);

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

  const handleRecharge = async () => {
    if (!user || !rechargeAmount) return;
    const num = parseFloat(rechargeAmount);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid recharge amount greater than 0");
      return;
    }
    try {
      setIsRecharging(true);
      await addBalanceToUsers({
        userIds: [user.id],
        amount: rechargeAmount,
        message: rechargeMessage || `${rechargeAmount} BDT recharge added by admin`,
      });
      toast.success(`৳${rechargeAmount} successfully added to ${user.phone}'s balance!`);
      setRechargeAmount("");
      setRechargeMessage("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add balance");
    } finally {
      setIsRecharging(false);
    }
  };

  const handleSendNotification = async () => {
    if (!user) return;
    const desc = notificationMessage.trim();
    if (!desc) {
      toast.error("Please enter a message content");
      return;
    }

    try {
      setSendingNotification(true);
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: notificationTitle.trim() || "Notice from Admin",
          description: desc,
          icon: notificationIcon,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Notification sent to ${user.phone}!`);
        setNotificationTitle("");
        setNotificationMessage("");
        fetchUserNotifications();
      } else {
        toast.error(data.error || "Failed to send notification");
      }
    } catch {
      toast.error("Network error while sending notification");
    } finally {
      setSendingNotification(false);
    }
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
            <div className="flex flex-wrap gap-2">
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
                onClick={() => setIsRestrictionsModalOpen(true)}
                className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 !rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-shield-alt mr-2 text-indigo-400"></i>
                Restrictions
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
                className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 !rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-key mr-2 text-amber-400"></i>
                Passwords
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10 !rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-arrow-up mr-2 text-rose-400"></i>
                Manual Withdraw
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

                  <Separator className="bg-gray-800" />

                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#9CA3AF] text-xs">Login Password:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-400">••••••••</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="h-6 px-2 text-[10px] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                      >
                        <i className="fas fa-key mr-1 text-[9px]"></i> Change
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#9CA3AF] text-xs">Withdraw PIN:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-400">••••••••</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="h-6 px-2 text-[10px] text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                      >
                        <i className="fas fa-shield-alt mr-1 text-[9px]"></i> Set / Change
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

          {/* Complete Bonus Tracking Overview */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Bonus & Reward Tracking</h3>
                <p className="text-xs text-gray-400">
                  Track Daily Login Rewards, Referral/Invitation Bonuses, and Lucky Wheel Spin Prizes
                </p>
              </div>
              <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs px-2.5 py-1 w-fit">
                Total Bonuses: ৳ {Number(bonusBreakdown?.totalBonuses ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Daily Signin Bonus */}
              <Card className="bg-[#151b28] border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Daily Signin Bonus</CardTitle>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                      {bonusBreakdown?.dailyBonusCount ?? 0} claims
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono text-amber-400">
                    ৳ {Number(bonusBreakdown?.dailyBonus ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Claimed daily check-in rewards</p>
                </CardContent>
              </Card>

              {/* Referral Bonus */}
              <Card className="bg-[#151b28] border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Referral Bonus</CardTitle>
                    <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 font-mono">
                      {bonusBreakdown?.referralBonusCount ?? 0} claims
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono text-sky-400">
                    ৳ {Number(bonusBreakdown?.referralBonus ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Invitation reward milestones</p>
                </CardContent>
              </Card>

              {/* Spin Wheel Bonus */}
              <Card className="bg-[#151b28] border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Spin Wheel Bonus</CardTitle>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                      {bonusBreakdown?.spinBonusCount ?? 0} spins
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono text-emerald-400">
                    ৳ {Number(bonusBreakdown?.spinBonus ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Lucky wheel prize cash payouts</p>
                </CardContent>
              </Card>

              {/* All Bonuses Combined */}
              <Card className="bg-[#151b28] border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-300">Total All Bonuses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono text-purple-300">
                    ৳ {Number(bonusBreakdown?.totalBonuses ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Net system bonus gifts granted</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Complete Financial Audit & Live Balance Flow */}
          <Card className="bg-primary border-gray-800 mb-8">
            <CardHeader className="border-b border-gray-800 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg text-white">Full User Balance & Cash Flow Reconciliation</CardTitle>
                  <p className="text-xs text-gray-400">
                    Real-time cross-audit: Deposits + Bonuses + Wins vs Withdraws + Bets + Remaining Balance
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">Live Wallet Balance: </span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    ৳ {Number(balanceAudit?.currentBalance ?? user?.wallet?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block mb-1">Approved Deposits</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    +৳ {Number(balanceAudit?.totalDeposits ?? financialOverview?.totalDeposits ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block mb-1">Approved Withdraws</span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    -৳ {Number(balanceAudit?.totalWithdraws ?? financialOverview?.totalWithdraws ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block mb-1">Total Bonuses Given</span>
                  <span className="text-base font-bold font-mono text-purple-400">
                    +৳ {Number(balanceAudit?.totalBonuses ?? bonusBreakdown?.totalBonuses ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block mb-1">Total Bets Placed</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    ৳ {Number(balanceAudit?.totalBet ?? bettingStatistics?.totalBet ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block mb-1">Total Wins Returned</span>
                  <span className="text-base font-bold font-mono text-sky-400">
                    ৳ {Number(balanceAudit?.totalWin ?? bettingStatistics?.totalWin ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block mb-1">Total Player Loss</span>
                  <span className="text-base font-bold font-mono text-red-400">
                    ৳ {Number(balanceAudit?.totalLoss ?? bettingStatistics?.totalLosss ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Game Play Sessions (Entry & Exit Balance Log) */}
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg text-white">Game Play Sessions (Entry & Exit Balance)</CardTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                    {gameSessions?.length ?? 0} Sessions
                  </Badge>
                </div>
                <CardDescription className="text-gray-400 mt-0.5 text-xs">
                  Tracks each game entry balance, exit balance, duration, and profit/loss. Click &quot;View Rounds&quot; to fetch on-demand round details for that specific time window without bloating database storage.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-gray-300">Game & Provider</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Session Time</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Entry Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Exit Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Session Net P/L</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Total Stakes & Wins</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-300 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!gameSessions || gameSessions.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-gray-500 text-sm">
                          No game sessions recorded for this user yet. When the user launches a slot or live game, each visit and balance flow will be logged here!
                        </TableCell>
                      </TableRow>
                    ) : (
                      gameSessions.map((session) => {
                        const net = session.netProfit ?? (session.endBalance !== null ? session.endBalance - session.startBalance : 0);
                        const isProfit = net >= 0;
                        const durationMins = session.endedAt
                          ? Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
                          : null;

                        return (
                          <TableRow key={session.id} className="border-gray-800 hover:bg-gray-800/40">
                            {/* Game Info */}
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-white text-xs">{session.gameName}</span>
                                <span className="text-[10px] text-gray-500 font-mono">UID: {session.gameUid}</span>
                              </div>
                            </TableCell>

                            {/* Session Time */}
                            <TableCell>
                              <div className="flex flex-col text-xs text-gray-300 font-mono">
                                <span>{moment(session.startedAt).format("DD MMM, hh:mm A")}</span>
                                <span className="text-[10px] text-gray-500">
                                  {session.endedAt ? `to ${moment(session.endedAt).format("hh:mm A")} (${durationMins}m)` : "In progress..."}
                                </span>
                              </div>
                            </TableCell>

                            {/* Entry Balance */}
                            <TableCell className="font-mono font-semibold text-sky-400 text-xs">
                              ৳ {session.startBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </TableCell>

                            {/* Exit Balance */}
                            <TableCell className="font-mono font-semibold text-xs text-white">
                              {session.endBalance !== null ? (
                                `৳ ${session.endBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                              ) : (
                                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                                  Playing...
                                </Badge>
                              )}
                            </TableCell>

                            {/* Session Net Result */}
                            <TableCell className="font-mono text-xs">
                              <span className={`font-bold ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                                {isProfit ? "+" : ""}৳ {net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>

                            {/* Total Stakes & Wins */}
                            <TableCell>
                              <div className="flex flex-col text-xs font-mono">
                                <span className="text-gray-300">
                                  Bet: <strong className="text-amber-400">৳ {session.totalBet.toLocaleString()}</strong>
                                </span>
                                <span className="text-gray-400 text-[11px]">
                                  Win: ৳ {session.totalWin.toLocaleString()} ({session.roundsCount} spins)
                                </span>
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {session.status === "ACTIVE" ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] animate-pulse">
                                  ● Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px]">
                                  Completed
                                </Badge>
                              )}
                            </TableCell>

                            {/* Action Button */}
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenSessionDetails(session)}
                                className="h-7 px-2.5 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 cursor-pointer"
                              >
                                <i className="fas fa-list-check mr-1.5 text-xs"></i> View Rounds
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* On-Demand Session Rounds Modal */}
          <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-950 border border-gray-800 text-white">
              <DialogHeader className="border-b border-gray-800 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <DialogTitle className="text-lg text-white flex items-center gap-2">
                      <span>{selectedSession?.gameName}</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                        UID: {selectedSession?.gameUid}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400 mt-1">
                      Session Time: {moment(selectedSession?.startedAt).format("DD MMM YYYY, hh:mm A")}{" "}
                      {selectedSession?.endedAt ? `to ${moment(selectedSession?.endedAt).format("hh:mm A")}` : "(Live)"}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Entry Bal:</span>
                      <span className="text-sky-400 font-bold">৳ {selectedSession?.startBalance.toLocaleString()}</span>
                    </div>
                    <div className="text-gray-600">→</div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Exit Bal:</span>
                      <span className="text-white font-bold">
                        {selectedSession?.endBalance !== null ? `৳ ${selectedSession?.endBalance.toLocaleString()}` : "Active"}
                      </span>
                    </div>
                    <div className="text-gray-600">|</div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Net P/L:</span>
                      {(() => {
                        const net = (selectedSession?.endBalance ?? selectedSession?.startBalance ?? 0) - (selectedSession?.startBalance ?? 0);
                        return (
                          <span className={`font-bold ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {net >= 0 ? "+" : ""}৳ {net.toLocaleString()}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-800/60">
                  <span className="text-xs text-gray-400 mr-1">Rounds Filter:</span>
                  <Button
                    size="sm"
                    variant={sessionRoundFilter === "ALL" ? "default" : "outline"}
                    onClick={() => setSessionRoundFilter("ALL")}
                    className={`text-xs h-6 px-2.5 ${sessionRoundFilter === "ALL" ? "bg-amber-500 text-black font-semibold" : "border-gray-700 bg-gray-900"}`}
                  >
                    All ({sessionRounds.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={sessionRoundFilter === "WIN" ? "default" : "outline"}
                    onClick={() => setSessionRoundFilter("WIN")}
                    className={`text-xs h-6 px-2.5 ${sessionRoundFilter === "WIN" ? "bg-emerald-600 text-white font-semibold" : "border-gray-700 bg-gray-900 text-emerald-400"}`}
                  >
                    Wins ({sessionRounds.filter((r) => r.status === "WIN").length})
                  </Button>
                  <Button
                    size="sm"
                    variant={sessionRoundFilter === "LOSS" ? "default" : "outline"}
                    onClick={() => setSessionRoundFilter("LOSS")}
                    className={`text-xs h-6 px-2.5 ${sessionRoundFilter === "LOSS" ? "bg-rose-600 text-white font-semibold" : "border-gray-700 bg-gray-900 text-rose-400"}`}
                  >
                    Losses ({sessionRounds.filter((r) => r.status === "LOSS").length})
                  </Button>
                </div>
              </DialogHeader>

              {/* Rounds Table */}
              <div className="py-2">
                {sessionLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FadeLoader color="#f59e0b" />
                    <span className="text-xs text-gray-400">Fetching round details from Seamless SoftAPI...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800 hover:bg-transparent">
                          <TableHead className="text-xs text-gray-400">Round ID</TableHead>
                          <TableHead className="text-xs text-gray-400">Stake (Bet)</TableHead>
                          <TableHead className="text-xs text-gray-400">Multiplier</TableHead>
                          <TableHead className="text-xs text-gray-400">Payout (Win)</TableHead>
                          <TableHead className="text-xs text-gray-400">Result</TableHead>
                          <TableHead className="text-xs text-gray-400">Balance After</TableHead>
                          <TableHead className="text-xs text-gray-400 text-right">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filtered = sessionRounds.filter((r) => {
                            if (sessionRoundFilter === "WIN") return r.status === "WIN";
                            if (sessionRoundFilter === "LOSS") return r.status === "LOSS";
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-gray-500 text-xs">
                                  No round records found for this specific session time window.
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return filtered.map((round: any, idx: number) => (
                            <TableRow key={idx} className="border-gray-800/80 hover:bg-gray-900/60 font-mono text-xs">
                              <TableCell className="font-semibold text-white">
                                #{round.gameRound || round.serialNumber?.slice(0, 14)}
                                {round.freeSpinBonus && (
                                  <Badge className="ml-1 bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] px-1 py-0">
                                    Spin: {round.freeSpinBonus}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-amber-400 font-semibold">
                                ৳ {Number(round.betAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className={round.multiplier > 1 ? "text-emerald-400 font-bold" : "text-gray-400"}>
                                {round.multiplier > 0 ? `${round.multiplier.toFixed(2)}x` : "0.00x"}
                              </TableCell>
                              <TableCell className={round.winAmount > 0 ? "text-emerald-400 font-semibold" : "text-gray-500"}>
                                ৳ {Number(round.winAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold ${
                                    round.status === "WIN"
                                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                      : round.status === "REFUND"
                                      ? "border-sky-500/40 text-sky-400 bg-sky-500/10"
                                      : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                                  }`}
                                >
                                  {round.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-300">
                                ৳ {Number(round.creditAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right text-gray-500 text-[11px] whitespace-nowrap">
                                {moment(round.createdAt).format("hh:mm:ss A")}
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recharge Section */}
            <Card className="bg-primary border-gray-800" id="recharge-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-plus-circle text-emerald-400"></i>
                  Recharge Wallet
                </CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Add funds to {user?.phone}&apos;s account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (BDT)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount to add"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      className="bg-[#1e293b] border-gray-800 focus:border-emerald-500 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recharge-note">Admin Note (Optional)</Label>
                    <Input
                      id="recharge-note"
                      placeholder="e.g. Deposit via bKash TrxID #..."
                      value={rechargeMessage}
                      onChange={(e) => setRechargeMessage(e.target.value)}
                      className="bg-[#1e293b] border-gray-800 text-white text-xs"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleRecharge}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 !rounded-button whitespace-nowrap cursor-pointer text-white font-semibold"
                  disabled={!rechargeAmount || isRecharging}
                >
                  <i className={`fas ${isRecharging ? "fa-spinner fa-spin" : "fa-plus-circle"} mr-2`}></i>
                  {isRecharging ? "Recharging..." : `Add ৳${rechargeAmount || "0"} Balance`}
                </Button>
              </CardFooter>
            </Card>

            {/* Manual Withdraw Section */}
            <Card className="bg-primary border-gray-800" id="withdraw-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-money-bill-wave text-rose-400"></i>
                  Manual Withdrawal
                </CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Deduct balance and issue manual payout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gray-950 border border-gray-800 flex justify-between items-center text-xs">
                    <span className="text-gray-400">Current Balance:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      ৳ {Number(user?.wallet?.balance ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Quickly deduct money from player balance, record bank/wallet number, and track manual payout history.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="w-full bg-rose-600 hover:bg-rose-700 !rounded-button whitespace-nowrap cursor-pointer text-white font-semibold"
                >
                  <i className="fas fa-arrow-up mr-2"></i>
                  Open Manual Withdraw
                </Button>
              </CardFooter>
            </Card>

            {/* Notification Section */}
            <Card
              className="bg-primary border-gray-800 flex flex-col justify-between"
              id="notification-section"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-bell text-amber-400"></i>
                  Send Notification
                </CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Send an in-app message to {user?.phone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="notif-title" className="text-xs text-gray-300">
                      Title (Optional)
                    </Label>
                    <Input
                      id="notif-title"
                      placeholder="e.g. Account Notice"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="bg-[#1e293b] border-gray-800 text-white text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-300">Icon</Label>
                    <select
                      value={notificationIcon}
                      onChange={(e) => setNotificationIcon(e.target.value)}
                      className="w-full h-8 bg-[#1e293b] border border-gray-800 rounded-md text-xs text-white px-2 focus:outline-none focus:border-amber-400"
                    >
                      <option value="INFO">Info ℹ️</option>
                      <option value="BELL">Bell 🔔</option>
                      <option value="BONUS">Bonus 🎁</option>
                      <option value="MONEY">Money 💰</option>
                      <option value="WARNING">Alert ⚠️</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="message" className="text-xs text-gray-300">
                    Message Content *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter message for user..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="bg-[#1e293b] border-gray-800 focus:border-[#007AFF] text-white min-h-[75px] text-xs"
                  />
                </div>

                {/* Mini List of Recent Notifications Sent */}
                {userNotifications.length > 0 && (
                  <div className="pt-2 border-t border-gray-800/80">
                    <div className="text-[11px] font-semibold text-gray-400 mb-1.5 flex justify-between">
                      <span>Recent Sent Notifications</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {userNotifications.length} items
                      </span>
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                      {userNotifications.slice(0, 4).map((n: any) => (
                        <div
                          key={n.id}
                          className="p-1.5 rounded bg-gray-950 border border-gray-800/80 text-[10px] space-y-0.5"
                        >
                          <div className="flex justify-between items-center text-gray-300">
                            <span className="font-semibold text-amber-300 truncate max-w-[150px]">
                              {n.title}
                            </span>
                            <span className="text-gray-500 text-[9px] font-mono">
                              {moment(n.createdAt).fromNow()}
                            </span>
                          </div>
                          <p className="text-gray-400 truncate">{n.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  onClick={handleSendNotification}
                  className="w-full bg-[#007AFF] hover:bg-[#0056b3] !rounded-button whitespace-nowrap cursor-pointer text-xs font-semibold"
                  disabled={!notificationMessage.trim() || sendingNotification}
                >
                  <i
                    className={`fas ${
                      sendingNotification
                        ? "fa-spinner fa-spin"
                        : "fa-paper-plane"
                    } mr-2`}
                  ></i>
                  {sendingNotification ? "Sending..." : "Send Notification"}
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
          {/* Password Change Modal */}
          <UserPasswordModal
            open={isPasswordModalOpen}
            onOpenChange={setIsPasswordModalOpen}
            user={
              user
                ? {
                    id: user.id,
                    phone: user.phone,
                    playerId: user.playerId,
                    name: user.name,
                  }
                : null
            }
            onSuccess={() => refetch()}
          />

          {/* Manual Withdraw Modal */}
          <ManualWithdrawModal
            open={isWithdrawModalOpen}
            onOpenChange={setIsWithdrawModalOpen}
            user={
              user
                ? {
                    id: user.id,
                    phone: user.phone,
                    playerId: user.playerId,
                    name: user.name,
                    wallet: { balance: Number(user.wallet?.balance ?? 0) },
                  }
                : null
            }
            onSuccess={() => refetch()}
          />

          {/* User Restrictions Modal */}
          {user && (
            <UserRestrictionsModal
              isOpen={isRestrictionsModalOpen}
              onClose={() => setIsRestrictionsModalOpen(false)}
              user={user as any}
              onUpdated={() => refetch()}
            />
          )}
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
