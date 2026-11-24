import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const dataToUpdate: Record<string, boolean> = {};

    if (typeof body.canDeposit === "boolean") {
      dataToUpdate.canDeposit = body.canDeposit;
    }
    if (typeof body.canWithdraw === "boolean") {
      dataToUpdate.canWithdraw = body.canWithdraw;
    }
    if (typeof body.canPlayGame === "boolean") {
      dataToUpdate.canPlayGame = body.canPlayGame;
    }
    if (typeof body.canClaimBonus === "boolean") {
      dataToUpdate.canClaimBonus = body.canClaimBonus;
    }
    if (typeof body.isBanned === "boolean") {
      dataToUpdate.isBanned = body.isBanned;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No valid restriction fields provided" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        playerId: true,
        phone: true,
        isBanned: true,
        canDeposit: true,
        canWithdraw: true,
        canPlayGame: true,
        canClaimBonus: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User restrictions updated successfully",
      restrictions: {
        isBanned: updatedUser.isBanned,
        canDeposit: updatedUser.canDeposit,
        canWithdraw: updatedUser.canWithdraw,
        canPlayGame: updatedUser.canPlayGame,
        canClaimBonus: updatedUser.canClaimBonus,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/users/[id]/restrictions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user restrictions" },
      { status: 500 }
    );
  }
}
