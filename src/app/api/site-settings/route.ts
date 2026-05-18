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
      siteSettings: siteSettings ? {
        ...siteSettings,
        // Ensure sliderImages and promotionsLogo are included
        sliderImages: siteSettings.sliderImages || [],
        promotionsLogo: siteSettings.promotionsLogo || null,
      } : {},
      bonusSettings: bonusSettings || {},
    });
  } catch  {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update site settings
export async function PATCH(request: Request) {
  try {
    // Handle JSON data
    const { siteSettings, bonusSettings } = await request.json();
    const siteSettingsData = siteSettings;
    const bonusSettingsData = bonusSettings;

    // Update site settings
    const updatedSiteSettings = await db.siteSetting.upsert({
      where: { id: siteSettingsData.id || "" },
      update: siteSettingsData,
      create: siteSettingsData,
    });

    // Update bonus settings
    const updatedBonusSettings = await db.bonus.upsert({
      where: { id: bonusSettingsData.id || "" },
      update: bonusSettingsData,
      create: bonusSettingsData,
    });

    return NextResponse.json({
      siteSettings: updatedSiteSettings,
      bonusSettings: updatedBonusSettings,
    });
  } catch  {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
