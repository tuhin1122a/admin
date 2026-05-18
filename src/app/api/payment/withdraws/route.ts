import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { WithdrawApprovalInput } from "@/type/payment";
import { DepositStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const card = searchParams.get("card");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");
  const status = searchParams.get("status") as DepositStatus & "ALL";
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");
  // const cursor = searchParams.get("cursor");
  const where: Prisma.WithdrawWhereInput = {};

  if (search) {
    where.OR = [
      {
        user: {
          phone: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }

  if (card) {
    where.cardId = card;
  }

  if (minAmount || maxAmount) {
    where.amount = {
      ...(minAmount && { gte: parseFloat(minAmount) }),
      ...(maxAmount && { lte: parseFloat(maxAmount) }),
    };
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  try {
    const paymentWallets = await db.paymentWallet.findMany({ where: {} });
    const totalWithdrawsCount = await db.withdraw.count({
      where,
    });
    let withdraws = await db.withdraw.findMany({
      where,
      include: {
        user: {
          select: {
            phone: true,
            id: true,
            playerId: true,
          },
        },
        card: {
          include: {
            container: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: limit * (page - 1),
    });

    withdraws = withdraws.map((withdraw) => {
      const paymentWallet = paymentWallets.find(
        (pw) => pw.id == withdraw.card.paymentWalletid
      );
      const extendedCard = { ...withdraw.card, paymentWallet };
      return { ...withdraw, card: extendedCard };
    });

    return NextResponse.json({
      success: true,
      data: {
        withdraws: withdraws,
        totalFound: totalWithdrawsCount,
        limit,
        paymentWallets: paymentWallets,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}

export const PUT = async (req: Request) => {
  try {
    const { withdrawId, actionType } =
      (await req.json()) as WithdrawApprovalInput;

    const withdraw = await db.withdraw.findUnique({
      where: { id: withdrawId },
      include: { user: true },
    });

    if (!withdraw)
      return NextResponse.json(
        { error: "Withdraw was not found" },
        { status: 404 }
      );

    const payload: Prisma.WithdrawUpdateInput = {};
    if (actionType == "approve") {
      payload.status = "APPROVED";
      // handle any message notification
    } else if (actionType == "reject") {
      payload.status = "REJECTED";
      // handle any message notification
    }

    await db.withdraw.update({ where: { id: withdrawId }, data: payload });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
