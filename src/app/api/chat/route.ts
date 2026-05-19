import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");

    // 1. Fetching chat messages for a specific user
    if (userId) {
      const messages = await db.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return NextResponse.json(messages);
    }

    // 2. Fetching users list (search or chat history)
    if (search && search.trim() !== "") {
      const users = await db.user.findMany({
        where: {
          OR: [
            { phone: { contains: search, mode: "insensitive" } },
            { playerId: { contains: search, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          phone: true,
          name: true,
          playerId: true,
        },
        take: 20,
      });

      // Get last message for each searched user
      const usersWithLastMsg = await Promise.all(
        users.map(async (user) => {
          const lastMsg = await db.chatMessage.findFirst({
            where: {
              OR: [
                { senderId: user.id },
                { receiverId: user.id },
              ],
            },
            orderBy: {
              createdAt: "desc",
            },
          });
          return {
            ...user,
            lastMessage: lastMsg?.content || "",
            lastMessageTime: lastMsg?.createdAt || null,
          };
        })
      );

      return NextResponse.json(usersWithLastMsg);
    }

    // Default: Get users with chat history
    const allChatMessages = await db.chatMessage.findMany({
      select: {
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const adminIds = await db.admin.findMany({ select: { id: true } });
    const adminIdSet = new Set(adminIds.map(a => a.id));
    adminIdSet.add("support");

    const userLastMessageMap = new Map<string, { content: string; createdAt: Date }>();
    for (const msg of allChatMessages) {
      const otherId = !adminIdSet.has(msg.senderId) ? msg.senderId : msg.receiverId;
      if (otherId && !adminIdSet.has(otherId)) {
        if (!userLastMessageMap.has(otherId)) {
          userLastMessageMap.set(otherId, { content: msg.content, createdAt: msg.createdAt });
        }
      }
    }

    const userIds = Array.from(userLastMessageMap.keys());

    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        phone: true,
        name: true,
        playerId: true,
      },
    });

    const result = users.map(user => ({
      ...user,
      lastMessage: userLastMessageMap.get(user.id)?.content || "",
      lastMessageTime: userLastMessageMap.get(user.id)?.createdAt || new Date(),
    })).sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CHAT_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { receiverId, content } = await req.json();

    if (!receiverId || !content || content.trim() === "") {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const message = await db.chatMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("[CHAT_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}