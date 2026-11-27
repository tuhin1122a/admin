/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { get9xBajiDb } from "@/lib/db9xbaji";

export const dynamic = "force-dynamic";

export interface CustomGgrLedgerEntry {
  id: string;
  type: "ADD" | "DEDUCT" | "SET";
  amount: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

const KEY_ALLOCATED = "CUSTOM_GGR_ALLOCATED_TOTAL";
const KEY_RATE = "CUSTOM_GGR_RATE_PERCENT";
const KEY_PAUSED = "CUSTOM_GGR_PAUSE_GAMES";
const KEY_LEDGER = "CUSTOM_GGR_LEDGER_HISTORY";

async function read9xBajiState() {
  const db9x = get9xBajiDb();

  const [configRows, betRows, userCount, depositAgg, withdrawAgg] =
    await Promise.all([
      db9x.siteConfig
        .findMany({
          where: {
            key: { in: [KEY_ALLOCATED, KEY_RATE, KEY_PAUSED, KEY_LEDGER] },
          },
        })
        .catch(() => []),
      db9x.betHistory
        .findMany({
          select: {
            userId: true,
            betAmount: true,
            winAmount: true,
            createdAt: true,
          },
        })
        .catch(() => []),
      db9x.user.count().catch(() => 0),
      db9x.deposit
        .aggregate({
          where: { status: "APPROVED" },
          _sum: { amount: true },
        })
        .catch(() => ({ _sum: { amount: 0 } })),
      db9x.withdraw
        .aggregate({
          where: { status: "APPROVED" },
          _sum: { amount: true },
        })
        .catch(() => ({ _sum: { amount: 0 } })),
    ]);

  const cfgMap = new Map<string, string>();
  for (const r of configRows) {
    cfgMap.set(r.key, r.value);
  }

  const allocatedCredit = Number(cfgMap.get(KEY_ALLOCATED) ?? 0);
  const ggrRatePercent = Number(cfgMap.get(KEY_RATE) ?? 17) || 17;
  const isGamesPaused = cfgMap.get(KEY_PAUSED) === "true";

  let ledger: CustomGgrLedgerEntry[] = [];
  const rawLedger = cfgMap.get(KEY_LEDGER);
  if (rawLedger) {
    try {
      const parsed = JSON.parse(rawLedger);
      if (Array.isArray(parsed)) ledger = parsed;
    } catch {
      ledger = [];
    }
  }

  // Compute total bet, total win, and net player loss on 9xBaji
  let totalBet = 0;
  let totalWin = 0;
  for (const b of betRows) {
    totalBet += Number(b.betAmount ?? 0);
    totalWin += Number(b.winAmount ?? 0);
  }

  // Net gaming loss across 9xBaji players
  const totalPlayerNetLoss = Number(Math.max(0, totalBet - totalWin).toFixed(2));
  const rateDecimal = ggrRatePercent / 100;
  const ggrConsumedAt17Pct = Number(
    (totalPlayerNetLoss * rateDecimal).toFixed(2)
  );
  const actualSoftApiCost6Pct = Number((totalPlayerNetLoss * 0.06).toFixed(2));
  const masterNetProfitFromGgr = Number(
    (ggrConsumedAt17Pct - actualSoftApiCost6Pct).toFixed(2)
  );

  // Remaining GGR balance available to 9xBaji
  const remainingGgrBalance = Number(
    (allocatedCredit - ggrConsumedAt17Pct).toFixed(2)
  );

  const totalDeposits = Number(depositAgg._sum.amount ?? 0);
  const totalWithdraws = Number(withdrawAgg._sum.amount ?? 0);

  return {
    allocatedCredit: Number(allocatedCredit.toFixed(2)),
    ggrRatePercent,
    isGamesPaused,
    isOutOfGgr: remainingGgrBalance <= 0,
    totalRounds: betRows.length,
    totalBet: Number(totalBet.toFixed(2)),
    totalWin: Number(totalWin.toFixed(2)),
    totalPlayerNetLoss,
    ggrConsumed: ggrConsumedAt17Pct,
    actualSoftApiCost6Pct,
    masterNetProfitFromGgr,
    remainingGgrBalance,
    siteStats: {
      totalUsers: userCount,
      totalDeposits,
      totalWithdraws,
    },
    ledger,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await read9xBajiState();
    return NextResponse.json({
      success: true,
      ...state,
    });
  } catch (error: any) {
    console.error("[9xBaji GGR Control GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Could not connect to 9xBaji database. Make sure container is on the same network.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any)?.role === "SUBADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "").toUpperCase(); // ADD | DEDUCT | SET_BALANCE | SET_RATE | TOGGLE_PAUSE
    const amount = Number(body.amount ?? 0);
    const note = String(body.note || "").trim();
    const adminName =
      (session.user as any)?.email || (session.user as any)?.name || "Master Admin";

    const db9x = get9xBajiDb();
    const current = await read9xBajiState();

    if (action === "TOGGLE_PAUSE") {
      const nextPaused = Boolean(body.isGamesPaused);
      await db9x.siteConfig.upsert({
        where: { key: KEY_PAUSED },
        update: { value: String(nextPaused) },
        create: { key: KEY_PAUSED, value: String(nextPaused) },
      });
      const updated = await read9xBajiState();
      return NextResponse.json({
        success: true,
        message: nextPaused
          ? "9xBaji game launches have been paused."
          : "9xBaji game launches are now active.",
        ...updated,
      });
    }

    if (action === "SET_RATE") {
      const nextRate = Number(body.ratePercent);
      if (!Number.isFinite(nextRate) || nextRate <= 0 || nextRate > 100) {
        return NextResponse.json(
          { error: "Rate must be between 1% and 100%" },
          { status: 400 }
        );
      }
      await db9x.siteConfig.upsert({
        where: { key: KEY_RATE },
        update: { value: String(nextRate) },
        create: { key: KEY_RATE, value: String(nextRate) },
      });
      const updated = await read9xBajiState();
      return NextResponse.json({
        success: true,
        message: `9xBaji GGR deduction rate updated to ${nextRate}%`,
        ...updated,
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid positive amount" },
        { status: 400 }
      );
    }

    let nextAllocated = current.allocatedCredit;
    let entryType: "ADD" | "DEDUCT" | "SET" = "ADD";

    if (action === "ADD") {
      nextAllocated = Number((current.allocatedCredit + amount).toFixed(2));
      entryType = "ADD";
    } else if (action === "DEDUCT") {
      nextAllocated = Number((current.allocatedCredit - amount).toFixed(2));
      entryType = "DEDUCT";
    } else if (action === "SET_BALANCE") {
      // Set exact remaining balance => allocated = ggrConsumed + targetRemainingBalance
      nextAllocated = Number((current.ggrConsumed + amount).toFixed(2));
      entryType = "SET";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newEntry: CustomGgrLedgerEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: entryType,
      amount: Number(amount.toFixed(2)),
      note:
        note ||
        (entryType === "ADD"
          ? `Added ৳${amount} GGR balance from RK444 Master Admin`
          : entryType === "DEDUCT"
          ? `Deducted ৳${amount} GGR balance by RK444 Master Admin`
          : `Set 9xBaji remaining GGR balance to ৳${amount}`),
      createdBy: adminName,
      createdAt: new Date().toISOString(),
    };

    const nextLedger = [newEntry, ...current.ledger].slice(0, 200);

    await Promise.all([
      db9x.siteConfig.upsert({
        where: { key: KEY_ALLOCATED },
        update: { value: String(nextAllocated) },
        create: { key: KEY_ALLOCATED, value: String(nextAllocated) },
      }),
      db9x.siteConfig.upsert({
        where: { key: KEY_LEDGER },
        update: { value: JSON.stringify(nextLedger) },
        create: { key: KEY_LEDGER, value: JSON.stringify(nextLedger) },
      }),
    ]);

    const updated = await read9xBajiState();
    return NextResponse.json({
      success: true,
      message:
        entryType === "ADD"
          ? `Successfully added ৳${amount.toLocaleString()} GGR balance to 9xBaji!`
          : entryType === "DEDUCT"
          ? `Successfully deducted ৳${amount.toLocaleString()} GGR balance from 9xBaji!`
          : `9xBaji remaining GGR balance set to ৳${amount.toLocaleString()}!`,
      ...updated,
    });
  } catch (error: any) {
    console.error("[9xBaji GGR Control POST Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update 9xBaji GGR balance",
      },
      { status: 500 }
    );
  }
}
