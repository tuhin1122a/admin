import { auth } from "@/auth";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { getSoftApiConfig } from "@/lib/softapi";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchLiveGgrBalance(): Promise<number | null> {
  try {
    const config = getSoftApiConfig();
    if (!config.token) return null;
    const res = await fetch(
      `${config.baseUrl}/ggr-balance?token=${encodeURIComponent(config.token)}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    if (Number(data?.code) === 0 && data?.data?.wallet !== undefined) {
      return Number(data.data.wallet);
    }
  } catch {
    // ignore
  }
  return null;
}

export interface StatementRecord {
  id: string;
  direction: "GIVEN" | "TAKEN";
  category:
    | "MANUAL_ADD"
    | "DEPOSIT_APPROVED"
    | "MANUAL_WITHDRAW"
    | "WITHDRAW_APPROVED"
    | "BONUS_CLAIMED";
  categoryLabel: string;
  amount: number;
  user: {
    id: string;
    phone: string;
    playerId: string;
    name: string;
  };
  method: string;
  reference: string;
  note: string;
  adminName: string;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRole = (session.user as any)?.role;
    const currentAdminId = session.user.id;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const filterType = (searchParams.get("type") || "ALL").toUpperCase(); // ALL | GIVEN | TAKEN | MANUAL
    const period = (searchParams.get("period") || "ALL").toUpperCase(); // TODAY | YESTERDAY | 7D | 30D | ALL
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15", 10)));

    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    const now = new Date();

    if (fromParam) {
      const parsedFrom = new Date(fromParam);
      if (!isNaN(parsedFrom.getTime())) {
        dateFrom = parsedFrom;
      }
    }
    if (toParam) {
      const parsedTo = new Date(toParam);
      if (!isNaN(parsedTo.getTime())) {
        if (
          parsedTo.getHours() === 0 &&
          parsedTo.getMinutes() === 0 &&
          parsedTo.getSeconds() === 0
        ) {
          parsedTo.setHours(23, 59, 59, 999);
        }
        dateTo = parsedTo;
      }
    }

    if (!dateFrom && !dateTo) {
      if (period === "TODAY") {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "YESTERDAY") {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        dateTo = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          23,
          59,
          59,
          999
        );
      } else if (period === "7D") {
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === "30D") {
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const createdAtFilter =
      dateFrom || dateTo
        ? {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          }
        : undefined;

    const userScopeWhere: any =
      currentRole === "SUBADMIN" && currentAdminId
        ? { subAdminId: currentAdminId }
        : {};

    // 1. Fetch manual balance additions, manual withdrawals & bonus notifications
    const manualAndBonusNotifications = await db.notification.findMany({
      where: {
        ...(createdAtFilter && { createdAt: createdAtFilter }),
        ...(Object.keys(userScopeWhere).length > 0 && { user: userScopeWhere }),
        OR: [
          { title: "Balance Added" },
          { title: "Manual Withdrawal Processed" },
          { title: { startsWith: "Daily Check-in" } },
          { title: { startsWith: "Mission Reward" } },
          { title: { contains: "App Download" } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            playerId: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // 2. Fetch Approved Deposits (money given to users)
    const approvedDeposits = await db.deposit.findMany({
      where: {
        status: "APPROVED",
        ...(createdAtFilter && { createdAt: createdAtFilter }),
        ...(Object.keys(userScopeWhere).length > 0 && { user: userScopeWhere }),
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            playerId: true,
            name: true,
          },
        },
        wallet: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // 3. Fetch Approved Withdrawals (money taken/withdrawn from users)
    const approvedWithdraws = await db.withdraw.findMany({
      where: {
        status: "APPROVED",
        ...(createdAtFilter && { createdAt: createdAtFilter }),
        ...(Object.keys(userScopeWhere).length > 0 && { user: userScopeWhere }),
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            playerId: true,
            name: true,
          },
        },
        card: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // 4. Fetch Claimed Invitation/Referral Milestone Rewards, Lucky Wheel Spins & Live GGR Balance
    const [claimedInviteRewards, luckyWheelSpins, liveGgrBalance] = await Promise.all([
      db.claimedInvitationReward
        .findMany({
          where: {
            ...(createdAtFilter && { createdAt: createdAtFilter }),
            ...(Object.keys(userScopeWhere).length > 0 && {
              invitationBonus: { user: userScopeWhere },
            }),
          },
          include: {
            reward: true,
            invitationBonus: {
              include: {
                user: {
                  select: {
                    id: true,
                    phone: true,
                    playerId: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1000,
        })
        .catch(() => []),
      db.luckyWheelSpin
        .findMany({
          where: {
            prizeValue: { gt: 0 },
            ...(createdAtFilter && { createdAt: createdAtFilter }),
            ...(Object.keys(userScopeWhere).length > 0 && { user: userScopeWhere }),
          },
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                playerId: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1000,
        })
        .catch(() => []),
      fetchLiveGgrBalance(),
    ]);

    const paymentWallets = await db.paymentWallet.findMany();
    const pwMap = new Map(paymentWallets.map((pw) => [pw.id, pw.walletName]));

    const manualWithdrawIds = new Set<string>();
    const records: StatementRecord[] = [];

    // Process Manual & Bonus Notifications
    for (const notif of manualAndBonusNotifications) {
      const meta = (notif.metadata as Record<string, any>) || {};
      const mType = String(meta.type || "");

      if (notif.title === "Balance Added" || mType === "balance_added") {
        let amt = Number(meta.amount ?? 0);
        if (!amt || isNaN(amt)) {
          const match = (notif.description || "").match(/([0-9]+(\.[0-9]+)?)/);
          if (match) amt = parseFloat(match[1]);
        }
        if (amt <= 0) continue;

        records.push({
          id: `manual-add-${notif.id}`,
          direction: "GIVEN",
          category: "MANUAL_ADD",
          categoryLabel: "Manual Deposit",
          amount: amt,
          user: {
            id: notif.user?.id || notif.userId,
            phone: notif.user?.phone || "N/A",
            playerId: notif.user?.playerId || "N/A",
            name: notif.user?.name || "Player",
          },
          method: "Admin Manual Recharge",
          reference: "DIRECT-ADD",
          note: meta.note || notif.description || "Manual balance added by Admin",
          adminName: meta.adminName || "Admin",
          createdAt: notif.createdAt.toISOString(),
        });
      } else if (
        notif.title === "Manual Withdrawal Processed" ||
        mType === "manual_withdraw"
      ) {
        const amt = Number(meta.amount ?? 0);
        if (meta.withdrawId) {
          manualWithdrawIds.add(String(meta.withdrawId));
        }
        if (amt <= 0) continue;

        records.push({
          id: `manual-wd-${notif.id}`,
          direction: "TAKEN",
          category: "MANUAL_WITHDRAW",
          categoryLabel: "Manual Withdraw",
          amount: amt,
          user: {
            id: notif.user?.id || notif.userId,
            phone: notif.user?.phone || "N/A",
            playerId: notif.user?.playerId || "N/A",
            name: notif.user?.name || "Player",
          },
          method: meta.walletName
            ? `${meta.walletName}${meta.walletNumber ? ` (${meta.walletNumber})` : ""}`
            : "Admin Manual Deduct",
          reference: meta.withdrawId
            ? `MWD-${String(meta.withdrawId).slice(-6).toUpperCase()}`
            : "DIRECT-DEDUCT",
          note: meta.note || notif.description || "Manual withdrawal processed by Admin",
          adminName: meta.adminName || "Admin",
          createdAt: notif.createdAt.toISOString(),
        });
      } else if (
        mType === "SIGNIN_CLAIM" ||
        notif.title?.startsWith("Daily Check-in") ||
        mType === "MISSION_CLAIM" ||
        notif.title?.startsWith("Mission Reward") ||
        notif.title?.includes("App Download")
      ) {
        let amt = Number(meta.prize ?? meta.rewardAmount ?? meta.amount ?? 0);
        if (!amt || isNaN(amt)) {
          const match = (notif.description || "").match(/৳\s*([0-9]+(\.[0-9]+)?)/);
          if (match) amt = parseFloat(match[1]);
        }
        if (amt <= 0) continue;

        const isMission =
          mType === "MISSION_CLAIM" || notif.title?.startsWith("Mission Reward");
        const isAppBonus = notif.title?.includes("App Download");
        const bonusSource = isMission
          ? "Mission Reward"
          : isAppBonus
          ? "App Download Bonus"
          : "Daily Check-in Bonus";

        records.push({
          id: `bonus-notif-${notif.id}`,
          direction: "GIVEN",
          category: "BONUS_CLAIMED",
          categoryLabel: bonusSource,
          amount: amt,
          user: {
            id: notif.user?.id || notif.userId,
            phone: notif.user?.phone || "N/A",
            playerId: notif.user?.playerId || "N/A",
            name: notif.user?.name || "Player",
          },
          method: bonusSource,
          reference: meta.missionId || (meta.day ? `DAY-${meta.day}` : "BONUS"),
          note: `${notif.title} (৳${amt.toFixed(2)})`,
          adminName: "System Bonus",
          createdAt: notif.createdAt.toISOString(),
        });
      }
    }

    // Process Referral Milestone Bonuses
    for (const inv of claimedInviteRewards) {
      const amt = Number(inv.reward?.prize ?? 0);
      if (amt <= 0) continue;
      const u = inv.invitationBonus?.user;
      records.push({
        id: `bonus-ref-${inv.id}`,
        direction: "GIVEN",
        category: "BONUS_CLAIMED",
        categoryLabel: "Referral Milestone Bonus",
        amount: amt,
        user: {
          id: u?.id || inv.invitationBonus?.userId || "N/A",
          phone: u?.phone || "N/A",
          playerId: u?.playerId || "N/A",
          name: u?.name || "Player",
        },
        method: "Referral Milestone",
        reference: `TARGET-${inv.reward?.targetReferral ?? 1}`,
        note: `Referral milestone reward claimed (Target: ${inv.reward?.targetReferral ?? 1} referrals, Prize: ৳${amt.toFixed(2)})`,
        adminName: "System Bonus",
        createdAt: inv.createdAt.toISOString(),
      });
    }

    // Process Lucky Wheel Spins
    for (const spin of luckyWheelSpins) {
      const amt = Number(spin.prizeValue ?? 0);
      if (amt <= 0) continue;
      records.push({
        id: `bonus-spin-${spin.id}`,
        direction: "GIVEN",
        category: "BONUS_CLAIMED",
        categoryLabel: "Lucky Wheel Bonus",
        amount: amt,
        user: {
          id: spin.user?.id || spin.userId,
          phone: spin.user?.phone || "N/A",
          playerId: spin.user?.playerId || "N/A",
          name: spin.user?.name || "Player",
        },
        method: "Lucky Wheel Spin",
        reference: `SPIN-${spin.id.slice(-6).toUpperCase()}`,
        note: `Lucky Wheel prize: ${spin.prizeLabel || `৳${amt.toFixed(2)}`}`,
        adminName: "System Bonus",
        createdAt: spin.createdAt.toISOString(),
      });
    }

    // Process Approved Deposits (and track any Deposit Bonus separately)
    for (const dep of approvedDeposits) {
      const amt = Number(dep.amount ?? 0);
      const bonus = Number(dep.bonus ?? 0);
      const gatewayName = dep.wallet?.paymentWalletId
        ? pwMap.get(dep.wallet.paymentWalletId) || "Gateway"
        : "Gateway";

      records.push({
        id: `dep-${dep.id}`,
        direction: "GIVEN",
        category: "DEPOSIT_APPROVED",
        categoryLabel: "Deposit Approved",
        amount: amt,
        user: {
          id: dep.user?.id || dep.userId,
          phone: dep.user?.phone || "N/A",
          playerId: dep.user?.playerId || "N/A",
          name: dep.user?.name || "Player",
        },
        method: `${gatewayName} (${dep.walletNumber || "N/A"})`,
        reference: dep.trxID || dep.trackingNumber || dep.id.slice(-8),
        note: `Approved deposit ৳${amt.toFixed(2)}${dep.senderNumber ? ` from ${dep.senderNumber}` : ""}`,
        adminName: "Admin / Auto",
        createdAt: dep.createdAt.toISOString(),
      });

      if (bonus > 0) {
        records.push({
          id: `dep-bonus-${dep.id}`,
          direction: "GIVEN",
          category: "BONUS_CLAIMED",
          categoryLabel: "Deposit Bonus",
          amount: bonus,
          user: {
            id: dep.user?.id || dep.userId,
            phone: dep.user?.phone || "N/A",
            playerId: dep.user?.playerId || "N/A",
            name: dep.user?.name || "Player",
          },
          method: `Deposit Bonus (${dep.bonusFor || "Promo"})`,
          reference: dep.trxID || dep.trackingNumber || dep.id.slice(-8),
          note: `Bonus ৳${bonus.toFixed(2)} on deposit of ৳${amt.toFixed(2)}`,
          adminName: "System Bonus",
          createdAt: dep.createdAt.toISOString(),
        });
      }
    }

    // Process Approved Withdrawals (skip duplicates already counted in manualWithdrawIds)
    for (const wd of approvedWithdraws) {
      if (manualWithdrawIds.has(wd.id)) continue;

      const amt = Number(wd.amount ?? 0);
      const gatewayName = wd.card?.paymentWalletid
        ? pwMap.get(wd.card.paymentWalletid) || "Payout"
        : "Payout";

      records.push({
        id: `wd-${wd.id}`,
        direction: "TAKEN",
        category: "WITHDRAW_APPROVED",
        categoryLabel: "Withdraw Approved",
        amount: amt,
        user: {
          id: wd.user?.id || wd.userId,
          phone: wd.user?.phone || "N/A",
          playerId: wd.user?.playerId || "N/A",
          name: wd.user?.name || "Player",
        },
        method: `${gatewayName} (${wd.card?.walletNumber || wd.card?.cardNumber || "N/A"})`,
        reference: `WD-${wd.id.slice(-8).toUpperCase()}`,
        note: `Player withdrawal of ৳${amt.toFixed(2)} to ${wd.card?.walletNumber || "account"}`,
        adminName: "Admin",
        createdAt: wd.createdAt.toISOString(),
      });
    }

    // Sort all records newest first
    records.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Compute overall totals across the period (before search/tab filter)
    let totalGiven = 0;
    let totalManualGiven = 0;
    let totalDepositGiven = 0;
    let totalBonusGiven = 0;
    let givenCount = 0;
    let manualGivenCount = 0;
    let depositGivenCount = 0;
    let bonusGivenCount = 0;

    let totalTaken = 0;
    let totalManualTaken = 0;
    let totalWithdrawTaken = 0;
    let takenCount = 0;
    let manualTakenCount = 0;
    let withdrawTakenCount = 0;

    for (const r of records) {
      if (r.direction === "GIVEN") {
        totalGiven += r.amount;
        givenCount++;
        if (r.category === "MANUAL_ADD") {
          totalManualGiven += r.amount;
          manualGivenCount++;
        } else if (r.category === "BONUS_CLAIMED") {
          totalBonusGiven += r.amount;
          bonusGivenCount++;
        } else {
          totalDepositGiven += r.amount;
          depositGivenCount++;
        }
      } else {
        totalTaken += r.amount;
        takenCount++;
        if (r.category === "MANUAL_WITHDRAW") {
          totalManualTaken += r.amount;
          manualTakenCount++;
        } else {
          totalWithdrawTaken += r.amount;
          withdrawTakenCount++;
        }
      }
    }

    // Filter by tab type and search query
    const filtered = records.filter((r) => {
      if (filterType === "GIVEN" && r.direction !== "GIVEN") return false;
      if (filterType === "TAKEN" && r.direction !== "TAKEN") return false;
      if (
        filterType === "MANUAL" &&
        r.category !== "MANUAL_ADD" &&
        r.category !== "MANUAL_WITHDRAW"
      ) {
        return false;
      }
      if (filterType === "BONUS" && r.category !== "BONUS_CLAIMED") {
        return false;
      }

      if (search) {
        const hay = `${r.user.phone} ${r.user.playerId} ${r.user.name} ${r.reference} ${r.method} ${r.note} ${r.categoryLabel}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }

      return true;
    });

    const totalFound = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      summary: {
        totalGiven: Number(totalGiven.toFixed(2)),
        totalManualGiven: Number(totalManualGiven.toFixed(2)),
        totalDepositGiven: Number(totalDepositGiven.toFixed(2)),
        totalBonusGiven: Number(totalBonusGiven.toFixed(2)),
        givenCount,
        manualGivenCount,
        depositGivenCount,
        bonusGivenCount,
        totalTaken: Number(totalTaken.toFixed(2)),
        totalManualTaken: Number(totalManualTaken.toFixed(2)),
        totalWithdrawTaken: Number(totalWithdrawTaken.toFixed(2)),
        takenCount,
        manualTakenCount,
        withdrawTakenCount,
        netDifference: Number((totalGiven - totalTaken).toFixed(2)),
        ggrBalance: liveGgrBalance !== null ? Number(liveGgrBalance.toFixed(2)) : null,
      },
      records: paginated,
      totalFound,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in GET /api/my-statement:", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
