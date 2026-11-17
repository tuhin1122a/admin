import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query) {
      // Return top 15 recent users if query is empty
      const users = await db.user.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          playerId: true,
          phone: true,
          name: true,
        },
      });
      return NextResponse.json({ users });
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          { playerId: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
      select: {
        id: true,
        playerId: true,
        phone: true,
        name: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
