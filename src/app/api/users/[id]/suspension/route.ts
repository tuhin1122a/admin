import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { UserSuspensionInput } from "@/type/user";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const { actionType } = (await req.json()) as UserSuspensionInput;

    const payload: Prisma.UserUpdateInput = {};

    if (actionType == "BAN") {
      payload.isBanned = true;
    } else if (actionType == "UNBAN") {
      payload.isBanned = false;
    } else {
      return NextResponse.json(
        { error: "No valid action type found" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: {
        id,
      },
      data: payload,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
