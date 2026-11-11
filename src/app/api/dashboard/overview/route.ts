import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  endOfYear,
  startOfYear,
  subDays,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { NextRequest, NextResponse } from "next/server";

// Count users with optional filters
const countUsers = async (where?: any) => {
  return db.user.count({ where });
};

// Sum amounts for models with optional filters
const sumAmount = async (model: any, where?: any) => {
  const result = await model.aggregate({
    _sum: { amount: true },
    where,
  });
  return Number(result._sum.amount ?? 0);
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentAdminId = session?.user?.id;
    const isSubAdmin = currentRole === "SUBADMIN";

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://rk444.site";

    let subAdminInfo = null;

    if (isSubAdmin && currentAdminId) {
      const adminRecord = await db.admin.findUnique({
        where: { id: currentAdminId },
      });
      const bankingCount = await db.depositWallet.count({
        where: { subAdminId: currentAdminId },
      });
      if (adminRecord) {
        const code =
          adminRecord.agentCode || `AGT${adminRecord.id.slice(-4).toUpperCase()}`;
        subAdminInfo = {
          isSubAdmin: true,
          agentCode: code,
          commissionRate: Number(adminRecord.commissionRate ?? 0),
          phone: adminRecord.phone || "",
          referralLink: `${siteUrl.replace(/\/+$/, "")}/register?agent=${code}`,
          commissionEarned: 0,
          myBankingCount: bankingCount,
        };
      }
    }

    // Role-based scoping: sub-admin only sees their own players and their financial traffic
    const baseUserWhere: any = isSubAdmin ? { subAdminId: currentAdminId } : {};
    const baseDepositWhere: any = isSubAdmin
      ? { user: { subAdminId: currentAdminId } }
      : {};
    const baseWithdrawWhere: any = isSubAdmin
      ? { user: { subAdminId: currentAdminId } }
      : {};

    const { searchParams } = new URL(req.url);

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;

    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // Stats
    const totalUsers = {
      last7Days: await countUsers({
        ...baseUserWhere,
        createdAt: { gte: last7Days },
      }),
      last30Days: await countUsers({
        ...baseUserWhere,
        createdAt: { gte: last30Days },
      }),
      allTime: await countUsers(baseUserWhere),
    };

    const activeUsers = {
      last7Days: await countUsers({
        ...baseUserWhere,
        createdAt: { gte: last7Days },
        isBanned: false,
      }),
      last30Days: await countUsers({
        ...baseUserWhere,
        createdAt: { gte: last30Days },
        isBanned: false,
      }),
      allTime: await countUsers({ ...baseUserWhere, isBanned: false }),
    };

    const bannedUsers = {
      last7Days: await countUsers({
        ...baseUserWhere,
        createdAt: { gte: last7Days },
        isBanned: true,
      }),
      last30Days: await countUsers({
        ...baseUserWhere,
        createdAt: { gte: last30Days },
        isBanned: true,
      }),
      allTime: await countUsers({ ...baseUserWhere, isBanned: true }),
    };

    const totalRevenue = {
      last7Days: await sumAmount(db.deposit, {
        ...baseDepositWhere,
        createdAt: { gte: last7Days },
        status: "APPROVED",
      }),
      last30Days: await sumAmount(db.deposit, {
        ...baseDepositWhere,
        createdAt: { gte: last30Days },
        status: "APPROVED",
      }),
      allTime: await sumAmount(db.deposit, {
        ...baseDepositWhere,
        status: "APPROVED",
      }),
    };

    const payoutsIssued = {
      last7Days: await sumAmount(db.withdraw, {
        ...baseWithdrawWhere,
        createdAt: { gte: last7Days },
        status: "APPROVED",
      }),
      last30Days: await sumAmount(db.withdraw, {
        ...baseWithdrawWhere,
        createdAt: { gte: last30Days },
        status: "APPROVED",
      }),
      allTime: await sumAmount(db.withdraw, {
        ...baseWithdrawWhere,
        status: "APPROVED",
      }),
    };

    const pendingWithdrawals = {
      last7Days: await sumAmount(db.withdraw, {
        ...baseWithdrawWhere,
        createdAt: { gte: last7Days },
        status: "PENDING",
      }),
      last30Days: await sumAmount(db.withdraw, {
        ...baseWithdrawWhere,
        createdAt: { gte: last30Days },
        status: "PENDING",
      }),
      allTime: await sumAmount(db.withdraw, {
        ...baseWithdrawWhere,
        status: "PENDING",
      }),
    };

    const successDeposits = {
      last7Days: await sumAmount(db.deposit, {
        ...baseDepositWhere,
        createdAt: { gte: last7Days },
        status: "APPROVED",
      }),
      last30Days: await sumAmount(db.deposit, {
        ...baseDepositWhere,
        createdAt: { gte: last30Days },
        status: "APPROVED",
      }),
      allTime: await sumAmount(db.deposit, {
        ...baseDepositWhere,
        status: "APPROVED",
      }),
    };

    const walletWhere: any = isSubAdmin
      ? { user: { subAdminId: currentAdminId, isBanned: false } }
      : { OR: [{ user: { isBanned: false } }, { user: null }] };

    const walletAgg = await db.wallet.aggregate({
      where: walletWhere,
      _sum: { balance: true },
    });
    const totalUserWalletBalance = Number(walletAgg._sum.balance ?? 0);
    const netAdminBalance = {
      last7Days: totalRevenue.last7Days - payoutsIssued.last7Days,
      last30Days: totalRevenue.last30Days - payoutsIssued.last30Days,
      allTime: totalRevenue.allTime - payoutsIssued.allTime,
    };

    if (subAdminInfo) {
      const netAll = netAdminBalance.allTime;
      const commRate = subAdminInfo.commissionRate || 0;
      subAdminInfo.commissionEarned =
        Math.round(Math.max(0, netAll * (commRate / 100)) * 100) / 100;
    }

    // Recent transactions (latest 7)
    const recentTransactions = await db.deposit.findMany({
      where: baseDepositWhere,
      orderBy: { createdAt: "desc" },
      take: 7,
      include: { user: true },
    });

    // Custom date filter data
    let filteredData = undefined;
    if (startDate && endDate) {
      filteredData = {
        totalUsers: await countUsers({
          ...baseUserWhere,
          createdAt: { gte: startDate, lte: endDate },
        }),
        activeUsers: await countUsers({
          ...baseUserWhere,
          createdAt: { gte: startDate, lte: endDate },
          isBanned: false,
        }),
        bannedUsers: await countUsers({
          ...baseUserWhere,
          createdAt: { gte: startDate, lte: endDate },
          isBanned: true,
        }),
        totalRevenue: await sumAmount(db.deposit, {
          ...baseDepositWhere,
          createdAt: { gte: startDate, lte: endDate },
          status: "APPROVED",
        }),
        payoutsIssued: await sumAmount(db.withdraw, {
          ...baseWithdrawWhere,
          createdAt: { gte: startDate, lte: endDate },
          status: "APPROVED",
        }),
        pendingWithdrawals: await sumAmount(db.withdraw, {
          ...baseWithdrawWhere,
          createdAt: { gte: startDate, lte: endDate },
          status: "PENDING",
        }),
        successDeposits: await sumAmount(db.deposit, {
          ...baseDepositWhere,
          createdAt: { gte: startDate, lte: endDate },
          status: "APPROVED",
        }),
      };
    }

    // deposit and withdraw chart
    const paymentFilter = searchParams.get("payment-filter") || "7days";
    const year = searchParams.get("year");

    let fromDate: Date = new Date(0);
    let toDate: Date = new Date();
    let labels: string[] = [];

    if (paymentFilter === "7days") {
      fromDate = subDays(toDate, 6);
      const days = eachDayOfInterval({ start: fromDate, end: toDate });
      labels = days.map((d) => format(d, "EEE"));
    } else if (paymentFilter === "lastMonth") {
      const today = new Date();
      toDate = subDays(today, 1);
      fromDate = subDays(toDate, 29);
      const days = eachDayOfInterval({ start: fromDate, end: toDate });
      labels = days.map((d) => format(d, "MMM dd"));
    } else if (paymentFilter === "year" && year) {
      fromDate = startOfYear(new Date(parseInt(year), 0));
      toDate = endOfYear(fromDate);
      const months = eachMonthOfInterval({ start: fromDate, end: toDate });
      labels = months.map((m) => format(m, "MMM"));
    } else {
      fromDate = new Date(0);
    }

    const deposits = await db.deposit.findMany({
      where: {
        ...baseDepositWhere,
        status: "APPROVED",
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const withdraws = await db.withdraw.findMany({
      where: {
        ...baseWithdrawWhere,
        status: "APPROVED",
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    let totalDeposits = 0;
    let totalWithdraws = 0;
    const revenueMap: Record<string, number> = {};
    const getLabel = (date: Date) => {
      if (paymentFilter === "7days") return format(date, "EEE");
      if (paymentFilter === "lastMonth") return format(date, "MMM dd");
      if (paymentFilter === "year") return format(date, "MMM");
      return format(date, "yyyy-MM-dd");
    };

    for (const label of labels) {
      revenueMap[label] = 0;
    }

    deposits.forEach((d: any) => {
      const label = getLabel(d.createdAt);
      totalDeposits += d.amount.toNumber();
      if (revenueMap[label] !== undefined) {
        revenueMap[label] += d.amount.toNumber();
      }
    });

    withdraws.forEach((w: any) => {
      const label = getLabel(w.createdAt);
      totalWithdraws += w.amount.toNumber();
      if (revenueMap[label] !== undefined) {
        revenueMap[label] -= w.amount.toNumber();
      }
    });


    const days: {
      date: string;
      deposits: number;
      withdraws: number;
      revenue: number;
    }[] = [];

    const dayCount =
      paymentFilter === "7days"
        ? 7
        : paymentFilter === "lastMonth"
        ? 30
        : paymentFilter === "year" && year
        ? 365
        : 0; // 'all' will be calculated from data

    const allDatesSet = new Set<string>();

    // collect all unique dates in data for 'all'
    if (paymentFilter === "all") {
      deposits.forEach((d: any) =>
        allDatesSet.add(format(d.createdAt, "yyyy-MM-dd"))
      );
      withdraws.forEach((w: any) =>
        allDatesSet.add(format(w.createdAt, "yyyy-MM-dd"))
      );
    }

    const datesToUse =
      paymentFilter === "all"
        ? Array.from(allDatesSet).sort()
        : Array.from({ length: dayCount }, (_, i) =>
            format(subDays(toDate, dayCount - 1 - i), "yyyy-MM-dd")
          );

    for (const dateStr of datesToUse) {
      const dailyDeposits = deposits.filter(
        (d: any) => format(d.createdAt, "yyyy-MM-dd") === dateStr
      );
      const dailyWithdraws = withdraws.filter(
        (w: any) => format(w.createdAt, "yyyy-MM-dd") === dateStr
      );

      const depositTotal = dailyDeposits.reduce(
        (sum: any, d: any) => sum + d.amount.toNumber(),
        0
      );
      const withdrawTotal = dailyWithdraws.reduce(
        (sum: any, w: any) => sum + w.amount.toNumber(),
        0
      );

      days.push({
        date: dateStr,
        deposits: depositTotal,
        withdraws: withdrawTotal,
        revenue: depositTotal - withdrawTotal,
      });
    }

    // Final response
    return NextResponse.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      totalRevenue,
      payoutsIssued,
      pendingWithdrawals,
      successDeposits,
      totalUserWalletBalance,
      netAdminBalance,
      subAdminInfo,
      recentTransactions,
      depositWithdraw: {
        filter: paymentFilter,
        from: fromDate,
        to: toDate,
        data: days,
      },
      revenue: totalDeposits - totalWithdraws,

      filteredData,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
