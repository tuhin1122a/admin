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

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const messages = await db.chatMessage.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: userId,
          },
          {
            senderId: userId,
            receiverId: session.user.id,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
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

    if (!receiverId || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const message = await db.chatMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("[CHAT_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}