import { auth } from "@/auth";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRole = (session.user as any)?.role;
    const currentAdminId = session.user.id;
    const { id: userId } = await params;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { cardContainer: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Sub-Admin check
    if (
      currentRole === "SUBADMIN" &&
      user.subAdminId &&
      user.subAdminId !== currentAdminId
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only manage your own assigned players" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, newPassword, newWithdrawPassword } = body;

    const updates: { password?: string; withdrawPassword?: string } = {};
    const messages: string[] = [];

    // 1. Change Login Password
    if (action === "change_login_password" || action === "change_both" || newPassword) {
      if (!newPassword || String(newPassword).trim().length < 6) {
        return NextResponse.json(
          { error: "Login password must be at least 6 characters" },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
      updates.password = hashedPassword;
      messages.push("Login password updated successfully");
    }

    // 2. Change Withdraw Password / PIN
    if (
      action === "change_withdraw_password" ||
      action === "change_both" ||
      newWithdrawPassword
    ) {
      if (!newWithdrawPassword || String(newWithdrawPassword).trim().length < 4) {
        return NextResponse.json(
          { error: "Withdraw password/PIN must be at least 4 characters" },
          { status: 400 }
        );
      }
      const hashedWithdraw = await bcrypt.hash(
        String(newWithdrawPassword).trim(),
        10
      );
      updates.withdrawPassword = hashedWithdraw;

      // Also sync or create CardContainer password
      if (user.cardContainer) {
        await db.cardContainer.update({
          where: { id: user.cardContainer.id },
          data: { password: hashedWithdraw },
        });
      } else {
        await db.cardContainer.create({
          data: {
            ownerName: user.name || "Player",
            password: hashedWithdraw,
            userId: user.id,
          },
        });
      }
      messages.push("Withdraw password / PIN updated successfully");
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No password changes provided" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: userId },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      message: messages.join(" and "),
    });
  } catch (error) {
    console.error("Error updating user passwords:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
