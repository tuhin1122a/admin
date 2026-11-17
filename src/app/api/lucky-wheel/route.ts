import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const DEFAULT_SLICES = [
  { id: 1, label: "💥 Blast", value: 0, type: "BLAST", color: "#DC2626", probability: 25 },
  { id: 2, label: "৳50 Cash", value: 50, type: "CASH", color: "#10B981", probability: 35 },
  { id: 3, label: "🔄 Respin", value: 1, type: "RESPIN", color: "#06B6D4", probability: 15 },
  { id: 4, label: "৳100 Cash", value: 100, type: "CASH", color: "#3B82F6", probability: 15 },
  { id: 5, label: "💥 Blast", value: 0, type: "BLAST", color: "#EF4444", probability: 12 },
  { id: 6, label: "20 Free Spins", value: 20, type: "FREE_SPINS", color: "#8B5CF6", probability: 8 },
  { id: 7, label: "👑 ৳500 JACKPOT", value: 500, type: "CASH", color: "#EAB308", probability: 0.001 },
  { id: 8, label: "🔄 Respin", value: 1, type: "RESPIN", color: "#EC4899", probability: 10 },
];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let setting = await db.luckyWheelSetting.findFirst();
    if (!setting) {
      setting = await db.luckyWheelSetting.create({
        data: {
          isActive: true,
          freeSpinsPerDay: 1,
          costPerSpin: 0,
          slices: DEFAULT_SLICES,
        },
      });
    }

    const recentSpins = await db.luckyWheelSpin.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            playerId: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ setting, recentSpins });
  } catch (error: any) {
    console.error("Error fetching lucky wheel in admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isActive, freeSpinsPerDay, slices } = body;

    let setting = await db.luckyWheelSetting.findFirst();
    if (!setting) {
      setting = await db.luckyWheelSetting.create({
        data: {
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          freeSpinsPerDay: Number(freeSpinsPerDay) || 1,
          costPerSpin: 0,
          slices: slices || DEFAULT_SLICES,
        },
      });
    } else {
      setting = await db.luckyWheelSetting.update({
        where: { id: setting.id },
        data: {
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
          ...(freeSpinsPerDay !== undefined && {
            freeSpinsPerDay: Number(freeSpinsPerDay),
          }),
          ...(slices !== undefined && { slices }),
        },
      });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    console.error("Error updating lucky wheel in admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
