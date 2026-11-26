import { NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const APK_FILENAME = "SMS-Reader-v1.0.3.apk";

/**
 * Mother Admin ONLY download endpoint for RK444 Agent Pay APK.
 * Sub-admins / Agents (role === "SUBADMIN") and unauthenticated users are blocked with 403.
 */
export async function GET() {
  try {
    const session = await auth();
    const role = String((session?.user as any)?.role || "").toUpperCase();

    if (!session?.user?.id || role === "SUBADMIN" || (role && role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Mother Admin access only" },
        { status: 403 }
      );
    }

    const apkPath = path.join(process.cwd(), "private-downloads", APK_FILENAME);
    if (!fs.existsSync(apkPath)) {
      return NextResponse.json(
        { success: false, error: "APK file not found on server" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(apkPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${APK_FILENAME}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("[api/agent-pay-apk] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to download APK" },
      { status: 500 }
    );
  }
}
