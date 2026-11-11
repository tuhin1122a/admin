import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getSoftApiConfig } from "@/lib/softapi";

async function fetchLiveGgrBalance(): Promise<number | null> {
  const config = getSoftApiConfig();
  if (!config.token) return null;
  try {
    const res = await fetch(
      `${config.baseUrl}/ggr-balance?token=${encodeURIComponent(config.token)}`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) }
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

export async function GET() {
  try {
    const [entries, liveBalance, walletAgg] = await Promise.all([
      db.ggrTopup.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      fetchLiveGgrBalance(),
      db.wallet.aggregate({
        where: {
          OR: [{ user: { isBanned: false } }, { user: null }],
        },
        _sum: { balance: true },
      }),
    ]);

    const totalUserWalletBalance = Number(walletAgg._sum.balance ?? 0);
    const maxLaunchBalance = liveBalance !== null ? liveBalance / 0.05 : null;
    // Capacity = how much more user balance can be added before hitting the 5% rule
    const remainingCapacity =
      maxLaunchBalance !== null
        ? Math.max(0, maxLaunchBalance - totalUserWalletBalance)
        : null;
    const capacityUsedPercent =
      maxLaunchBalance !== null && maxLaunchBalance > 0
        ? Math.min(100, (totalUserWalletBalance / maxLaunchBalance) * 100)
        : null;

    let opening = 0;
    let topups = 0;
    let adjustments = 0;
    for (const e of entries) {
      const amt = Number(e.amount);
      if (e.type === "OPENING") opening += amt;
      else if (e.type === "TOPUP") topups += amt;
      else adjustments += amt;
    }
    const totalFunded = opening + topups + adjustments;
    const used =
      liveBalance !== null ? Math.max(0, totalFunded - liveBalance) : null;
    const usedPercent =
      used !== null && totalFunded > 0
        ? Math.min(100, (used / totalFunded) * 100)
        : null;

    // Average daily usage since the first ledger entry
    let avgDailyUsage: number | null = null;
    let daysLeft: number | null = null;
    if (used !== null && entries.length > 0) {
      const first = entries[entries.length - 1].createdAt;
      const days = Math.max(
        1,
        (Date.now() - new Date(first).getTime()) / 86400000
      );
      avgDailyUsage = used / days;
      if (avgDailyUsage > 0 && liveBalance !== null) {
        daysLeft = liveBalance / avgDailyUsage;
      }
    }

    return NextResponse.json({
      liveBalance,
      maxLaunchBalance,
      totalUserWalletBalance,
      remainingCapacity,
      capacityUsedPercent,
      totals: {
        opening,
        topups,
        adjustments,
        totalFunded,
        used,
        usedPercent,
        avgDailyUsage,
        daysLeft,
        lastTopupAt:
          entries.find((e) => e.type === "TOPUP")?.createdAt ?? null,
      },
      entries: entries.map((e) => ({
        ...e,
        amount: Number(e.amount),
        liveBalance: e.liveBalance !== null ? Number(e.liveBalance) : null,
      })),
    });
  } catch (error: any) {
    const msg = String(error?.message || "");
    const tableMissing =
      msg.includes("GgrTopup") || msg.includes("does not exist");
    return NextResponse.json(
      {
        error: tableMissing
          ? "GGR ledger table not found. Run `npx prisma db push` once to create it."
          : msg || "Failed to load GGR ledger",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = ["OPENING", "TOPUP", "ADJUSTMENT"].includes(body?.type)
      ? body.type
      : "TOPUP";
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json(
        { error: "Amount must be a non-zero number." },
        { status: 400 }
      );
    }
    if (type !== "ADJUSTMENT" && amount < 0) {
      return NextResponse.json(
        { error: "Opening / top-up amount must be positive." },
        { status: 400 }
      );
    }
    if (type === "OPENING") {
      const existing = await db.ggrTopup.count({ where: { type: "OPENING" } });
      if (existing > 0) {
        return NextResponse.json(
          { error: "Opening balance already recorded. Use Adjustment instead." },
          { status: 400 }
        );
      }
    }

    const session = await auth();
    const liveBalance = await fetchLiveGgrBalance();

    const entry = await db.ggrTopup.create({
      data: {
        type,
        amount,
        method: body?.method ? String(body.method).slice(0, 50) : null,
        reference: body?.reference ? String(body.reference).slice(0, 120) : null,
        note: body?.note ? String(body.note).slice(0, 500) : null,
        liveBalance,
        createdBy:
          (session?.user as any)?.email || (session?.user as any)?.name || null,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only ADMIN can delete ledger entries." },
        { status: 403 }
      );
    }
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await db.ggrTopup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete entry" },
      { status: 500 }
    );
  }
}

