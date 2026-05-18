import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Filters
    const status = searchParams.get("status") || "all"; // banned | unbanned | all
    const search = searchParams.get("search") || "";
    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Where clause
    const where: any = {};

    if (status === "banned") {
      where.isBanned = true;
    } else if (status === "unbanned") {
      where.isBanned = false;
    }

    if (search) {
      where.OR = [
        { playerId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Total count for pagination
    const total = await db.user.count({ where });

    // Fetch paginated users
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        playerId: true,
        phone: true,
        isBanned: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,

      total,
      page: +page,
      limit: +limit,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users." },
      { status: 500 }
    );
  }
}
