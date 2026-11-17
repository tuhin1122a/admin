import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function PUT(
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

    const {
      title,
      context,
      category,
      badge,
      badgeColor,
      turnover,
      minDeposit,
      description,
      content,
      image,
      targetType,
      targetUserIds,
      isActive,
      sortOrder,
    } = body;

    const updated = await db.promotion.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(context !== undefined && { context }),
        ...(category !== undefined && { category }),
        ...(badge !== undefined && { badge }),
        ...(badgeColor !== undefined && { badgeColor }),
        ...(turnover !== undefined && { turnover }),
        ...(minDeposit !== undefined && { minDeposit }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(image !== undefined && { image }),
        ...(targetType !== undefined && { targetType }),
        ...(targetUserIds !== undefined && {
          targetUserIds: Array.isArray(targetUserIds) ? targetUserIds : [],
        }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) || 0 }),
      },
    });

    return NextResponse.json({ success: true, promotion: updated });
  } catch (error: any) {
    console.error("Error updating promotion in admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.promotion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting promotion in admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
