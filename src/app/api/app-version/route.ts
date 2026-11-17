import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export const DEFAULT_CONFIG = {
  latestVersion: "1.0.0",
  versionCode: 1,
  minVersion: "1.0.0",
  forceUpdate: false,
  downloadUrl: "https://rk444.site/app.apk",
  releaseNotes: "• 24H Lucky Wheel with real cash drops\n• Improved deposit & withdrawal speeds\n• Bug fixes and UI enhancements",
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configRow = await db.siteConfig
      .findUnique({
        where: { key: "MOBILE_APP_VERSION" },
      })
      .catch(() => null);

    let config = DEFAULT_CONFIG;
    if (configRow?.value) {
      try {
        config = { ...DEFAULT_CONFIG, ...JSON.parse(configRow.value) };
      } catch {
        // fallback
      }
    }

    return NextResponse.json({ success: true, ...config });
  } catch (error: any) {
    console.error("Error fetching app version in admin:", error);
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
    const { latestVersion, versionCode, minVersion, forceUpdate, downloadUrl, releaseNotes } = body;

    const newConfig = {
      latestVersion: latestVersion || "1.0.0",
      versionCode: Number(versionCode) || 1,
      minVersion: minVersion || "1.0.0",
      forceUpdate: Boolean(forceUpdate),
      downloadUrl: downloadUrl || "https://rk444.site/app.apk",
      releaseNotes: releaseNotes || "",
    };

    await db.siteConfig.upsert({
      where: { key: "MOBILE_APP_VERSION" },
      update: { value: JSON.stringify(newConfig) },
      create: { key: "MOBILE_APP_VERSION", value: JSON.stringify(newConfig) },
    });

    return NextResponse.json({ success: true, config: newConfig });
  } catch (error: any) {
    console.error("Error saving app version in admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
