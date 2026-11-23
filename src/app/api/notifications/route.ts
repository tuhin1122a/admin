import { auth } from "@/auth";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { NotificationIcon } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch notifications
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");

    // If specific userId is requested
    if (userId) {
      const notifications = await db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        notifications,
        total: notifications.length,
      });
    }

    // System overview for Admin Bell Dropdown:
    // Fetches pending deposits count, pending withdraws count, and recent user notifications
    const [pendingDeposits, pendingWithdraws, recentNotifications] =
      await Promise.all([
        db.deposit.count({ where: { status: "PENDING" } }),
        db.withdraw.count({ where: { status: "PENDING" } }),
        db.notification.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                playerId: true,
              },
            },
          },
        }),
      ]);

    const totalUnreadAlerts = pendingDeposits + pendingWithdraws;

    return NextResponse.json({
      success: true,
      pendingDeposits,
      pendingWithdraws,
      totalAlerts: totalUnreadAlerts,
      recentNotifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

// POST: Send notification(s) to a user, multiple users, or all users
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      userId,
      userIds,
      sendToAll = false,
      title,
      description,
      icon = "INFO",
    } = body;

    const notifTitle = String(title || "").trim();
    const notifDesc = String(description || "").trim();

    if (!notifDesc && !notifTitle) {
      return NextResponse.json(
        { error: "Notification message content is required" },
        { status: 400 }
      );
    }

    const effectiveTitle = notifTitle || "Notice from Admin";

    // Validate icon against Prisma NotificationIcon enum
    const validIcons = Object.values(NotificationIcon);
    const effectiveIcon: NotificationIcon = validIcons.includes(icon)
      ? (icon as NotificationIcon)
      : NotificationIcon.INFO;

    let targetUserIds: string[] = [];

    if (sendToAll) {
      const allUsers = await db.user.findMany({
        where: { isBanned: false },
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (userId) {
      targetUserIds = [userId];
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: "At least one target user must be specified" },
        { status: 400 }
      );
    }

    const notificationsData = targetUserIds.map((uid) => ({
      userId: uid,
      title: effectiveTitle,
      description: notifDesc,
      icon: effectiveIcon,
      isRead: false,
    }));

    // Insert into database
    await db.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent successfully to ${targetUserIds.length} user(s)!`,
      count: targetUserIds.length,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

// PATCH: Mark notification as read
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isRead = true } = body;

    if (!id) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    await db.notification.update({
      where: { id },
      data: { isRead: Boolean(isRead) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

// DELETE: Delete notification
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
