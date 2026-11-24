import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export interface BonusMissionConfig {
  pageMissionsEnabled: boolean;
  pageRewardCenterEnabled: boolean;
  bonusAppDownloadEnabled: boolean;
  bonusAppDownloadAmount: number;
  luckyWheelEnabled: boolean;

  requireDepositToClaimBonus: boolean;
  minDepositRequiredToClaim: number;

  dailyLoginReward: number;
  dailyLoginEnabled: boolean;
  dailyDeposit500Reward: number;
  dailyDeposit500Enabled: boolean;
  firstDepositBadgeReward: number;
  firstDepositBadgeEnabled: boolean;
  dailyTurnoverReward: number;
  dailyTurnoverEnabled: boolean;
  weeklyDeposit5000Reward: number;
  weeklyDeposit5000Enabled: boolean;
  weeklyInviteReward: number;
  weeklyInviteEnabled: boolean;
  achieveInvite5Reward: number;
  achieveInvite5Enabled: boolean;

  dailyCheckinEnabled: boolean;
  dailyCheckinDay1: number;
  dailyCheckinDay2: number;
  dailyCheckinDay3: number;
  dailyCheckinDay4: number;
  dailyCheckinDay5: number;
  dailyCheckinDay6: number;
  dailyCheckinDay7: number;
}

export const DEFAULT_BONUS_MISSION_CONFIG: BonusMissionConfig = {
  pageMissionsEnabled: true,
  pageRewardCenterEnabled: true,
  bonusAppDownloadEnabled: false,
  bonusAppDownloadAmount: 0,
  luckyWheelEnabled: true,

  requireDepositToClaimBonus: true,
  minDepositRequiredToClaim: 100,

  dailyLoginReward: 0,
  dailyLoginEnabled: false,
  dailyDeposit500Reward: 50,
  dailyDeposit500Enabled: true,
  firstDepositBadgeReward: 100,
  firstDepositBadgeEnabled: true,
  dailyTurnoverReward: 60,
  dailyTurnoverEnabled: true,
  weeklyDeposit5000Reward: 300,
  weeklyDeposit5000Enabled: true,
  weeklyInviteReward: 500,
  weeklyInviteEnabled: true,
  achieveInvite5Reward: 600,
  achieveInvite5Enabled: true,

  dailyCheckinEnabled: true,
  dailyCheckinDay1: 2,
  dailyCheckinDay2: 3,
  dailyCheckinDay3: 5,
  dailyCheckinDay4: 5,
  dailyCheckinDay5: 8,
  dailyCheckinDay6: 10,
  dailyCheckinDay7: 20,
};

const SITE_CONFIG_KEY = "BONUS_MISSION_ENGINE_CONFIG";

export async function GET() {
  try {
    const entry = await db.siteConfig.findUnique({
      where: { key: SITE_CONFIG_KEY },
    });

    let config = { ...DEFAULT_BONUS_MISSION_CONFIG };
    if (entry?.value) {
      try {
        const parsed = JSON.parse(entry.value);
        config = { ...config, ...parsed };
      } catch (e) {
        console.error("Failed to parse bonus mission config:", e);
      }
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error("GET /api/admin/bonus-missions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load config" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const configToSave: BonusMissionConfig = {
      ...DEFAULT_BONUS_MISSION_CONFIG,
      ...body,
    };

    await db.siteConfig.upsert({
      where: { key: SITE_CONFIG_KEY },
      create: {
        key: SITE_CONFIG_KEY,
        value: JSON.stringify(configToSave),
      },
      update: {
        value: JSON.stringify(configToSave),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bonus & Mission Engine settings updated successfully",
      config: configToSave,
    });
  } catch (error: any) {
    console.error("POST /api/admin/bonus-missions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save config" },
      { status: 500 }
    );
  }
}
