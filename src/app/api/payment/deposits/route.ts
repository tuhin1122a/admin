import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { DepositApprovalInput } from "@/type/payment";
import { DepositStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const gateway = searchParams.get("gateway");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");
  const status = searchParams.get("status") as DepositStatus & "ALL";
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");

  // const cursor = searchParams.get("cursor");
  const where: Prisma.DepositWhereInput = { trxID: { not: null } };

  if (search) {
    where.OR = [
      { trxID: { contains: search, mode: "insensitive" } },
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

  if (gateway) {
    const paymentWallet = await db.paymentWallet.findFirst({
      where: { walletName: gateway },
    });
    if (paymentWallet) {
      where.wallet = {
        paymentWalletId: paymentWallet.id,
      };
    }
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
    const totalDepositsCount = await db.deposit.count({
      where,
    });
    let deposits = await db.deposit.findMany({
      where,
      include: {
        user: {
          select: {
            phone: true,
            id: true,
            playerId: true,
          },
        },
        wallet: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: limit * (page - 1),
    });

    deposits = deposits.map((deposit) => {
      const paymentWallet = paymentWallets.find(
        (pw) => pw.id == deposit.wallet.paymentWalletId
      );
      const extendedWallet = { ...deposit.wallet, paymentWallet };
      return { ...deposit, wallet: extendedWallet };
    });

    return NextResponse.json({
      success: true,
      data: {
        deposits: deposits,
        totalFound: totalDepositsCount,
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
    const { depositId, actionType } =
      (await req.json()) as DepositApprovalInput;

    const deposit = await db.deposit.findUnique({
      where: { id: depositId },
      include: { user: true },
    });

    if (!deposit)
      return NextResponse.json(
        { error: "Deposit was not found" },
        { status: 404 }
      );
    const payload: Prisma.DepositUpdateInput = {};
    if (actionType == "approve") {
      payload.status = "APPROVED";

      await db.wallet.update({
        where: { userId: deposit.user.id },
        data: {
          balance: { increment: deposit.amount },
          turnOver: { increment: deposit.amount },
        },
      });

      const approvedDepositsCount = await db.deposit.count({
        where: {
          userId: deposit.user.id,
          status: "APPROVED",
        },
      });

      if (approvedDepositsCount === 0) {
        if (deposit.user.invitedById) {
          await db.invitationBonus.update({
            where: {
              userId: deposit.user.invitedById,
            },
            data: {
              totalValidreferral: {
                increment: 1,
              },
            },
          });
        }
      }

      const signinRewards = await db.signinBonusRewards.findMany({
        where: {},
      });

      const claimedSigninRewards = await db.claimedSigninReward.findMany({
        where: { userId: deposit.user.id, isClamed: true },
      });

      const lastReward = signinRewards.find((signinReward) => {
        return !claimedSigninRewards.some(
          (claimed) => claimed.rewardId === signinReward.id
        );
      });

      if (lastReward && +deposit.amount >= lastReward.prize) {
        await db.deposit.update({
          where: {
            id: deposit.id,
          },
          data: {
            ClaimedSigninReward: {
              create: {
                user: {
                  connect: {
                    id: deposit.userId,
                  },
                },
                reward: {
                  connect: {
                    id: lastReward!.id,
                  },
                },
              },
            },
          },
        });
      }
    } else if (actionType == "reject") {
      payload.status = "REJECTED";
      // handle any message notification
    }

    await db.deposit.update({ where: { id: depositId }, data: payload });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
