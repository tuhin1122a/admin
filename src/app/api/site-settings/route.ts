import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET endpoint to fetch all settings
export async function GET() {
  try {
    const [siteSettings, bonusSettings] = await Promise.all([
      db.siteSetting.findFirst(),
      db.bonus.findFirst(),
    ]);

    return NextResponse.json({
      siteSettings: {
        id: siteSettings?.id || "",
        maxWithdraw: siteSettings?.maxWithdraw ? Number(siteSettings.maxWithdraw) : 0,
        minWithdraw: siteSettings?.minWithdraw ? Number(siteSettings.minWithdraw) : 0,
        dpTurnover: siteSettings?.dpTurnover ? Number(siteSettings.dpTurnover) : 0,
        sliderImages: siteSettings?.sliderImages || [],
        promotionsLogo: siteSettings?.promotionsLogo || "",
      },
      bonusSettings: {
        id: bonusSettings?.id || "",
        signinBonus: bonusSettings?.signinBonus ? Number(bonusSettings.signinBonus) : 0,
        referralBonus: bonusSettings?.referralBonus ? Number(bonusSettings.referralBonus) : 0,
      },
    });
  } catch (err) {
    console.error("Error fetching settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update site settings
export async function PATCH(request: Request) {
  try {
    const { siteSettings, bonusSettings } = await request.json();

    // 1. Update site settings
    const firstSite = await db.siteSetting.findFirst();
    const siteSettingsData = {
      maxWithdraw: siteSettings.maxWithdraw,
      minWithdraw: siteSettings.minWithdraw,
      dpTurnover: siteSettings.dpTurnover,
      sliderImages: siteSettings.sliderImages || [],
      promotionsLogo: siteSettings.promotionsLogo || "",
    };

    let updatedSiteSettings;
    if (firstSite) {
      updatedSiteSettings = await db.siteSetting.update({
        where: { id: firstSite.id },
        data: siteSettingsData,
      });
    } else {
      updatedSiteSettings = await db.siteSetting.create({
        data: siteSettingsData,
      });
    }

    // 2. Update bonus settings
    const firstBonus = await db.bonus.findFirst();
    const bonusSettingsData = {
      signinBonus: Number(bonusSettings.signinBonus || 0),
      referralBonus: Number(bonusSettings.referralBonus || 0),
    };

    let updatedBonusSettings;
    if (firstBonus) {
      updatedBonusSettings = await db.bonus.update({
        where: { id: firstBonus.id },
        data: bonusSettingsData,
      });
    } else {
      updatedBonusSettings = await db.bonus.create({
        data: bonusSettingsData,
      });
    }

    return NextResponse.json({
      siteSettings: updatedSiteSettings,
      bonusSettings: updatedBonusSettings,
    });
  } catch (err) {
    console.error("Error updating settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
