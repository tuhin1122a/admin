import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") || searchParams.get("agent");

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing agent code parameter" },
        { status: 400 }
      );
    }

    const agent = await db.admin.findUnique({
      where: { agentCode: String(code).trim().toUpperCase() },
      select: {
        id: true,
        name: true,
        agentCode: true,
        isActive: true,
        phone: true,
      },
    });

    if (!agent || !agent.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive agent code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        agentCode: agent.agentCode,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to resolve agent" },
      { status: 500 }
    );
  }
}

