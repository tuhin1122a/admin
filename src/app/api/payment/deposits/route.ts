import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { DepositApprovalInput } from "@/type/payment";
import { DepositStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const currentAdminId = session?.user?.id;

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

  // Sub-Admin can only view deposits from their own players
  if (currentRole === "SUBADMIN" && currentAdminId) {
    where.user = {
      ...((where.user as any) || {}),
      subAdminId: currentAdminId,
    } as any;
  }

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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentRole = (session.user as any)?.role;
    const currentAdminId = session.user.id;

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

    if (
      currentRole === "SUBADMIN" &&
      deposit.user?.subAdminId !== currentAdminId
    ) {
      return NextResponse.json(
        { error: "Forbidden: you can only manage your own players' deposits" },
        { status: 403 }
      );
    }

    if (deposit.status !== "PENDING") {
      return NextResponse.json(
        { error: "This deposit has already been processed" },
        { status: 400 }
      );
    }

    if (actionType == "approve") {
      const cleanTrx = deposit.trxID ? deposit.trxID.trim() : "";
      if (cleanTrx) {
        // Enforce strict uniqueness: TrxID cannot be approved more than once across all deposits
        const alreadyApproved = await db.deposit.findFirst({
          where: {
            trxID: { equals: cleanTrx, mode: "insensitive" },
            status: "APPROVED",
            id: { not: depositId },
          },
        });
        if (alreadyApproved) {
          return NextResponse.json(
            {
              error: `Transaction ID "${cleanTrx}" has already been approved for another deposit. Cannot approve duplicate TrxID!`,
            },
            { status: 400 }
          );
        }
      }

      const approved = await db.$transaction(
        async (tx) => {
          if (cleanTrx) {
            const txDuplicate = await tx.deposit.findFirst({
              where: {
                trxID: { equals: cleanTrx, mode: "insensitive" },
                status: "APPROVED",
                id: { not: depositId },
              },
            });
            if (txDuplicate) {
              throw new Error(`Transaction ID "${cleanTrx}" has already been approved.`);
            }
          }

          // Conditional atomic status transition prevents double-crediting on concurrent clicks
          const statusUpdated = await tx.deposit.updateMany({
            where: { id: depositId, status: "PENDING" },
            data: { status: "APPROVED" },
          });

          if (statusUpdated.count === 0) {
            return false;
          }

          const previousApprovedCount = await tx.deposit.count({
            where: {
              userId: deposit.user.id,
              status: "APPROVED",
              id: { not: depositId },
            },
          });

          await tx.wallet.update({
            where: { userId: deposit.user.id },
            data: {
              balance: { increment: deposit.amount },
              turnOver: { increment: deposit.amount },
              signinBonus: false,
            },
          });

          if (previousApprovedCount === 0 && deposit.user.invitedById) {
            await tx.invitationBonus
              .update({
                where: { userId: deposit.user.invitedById },
                data: {
                  totalValidreferral: { increment: 1 },
                },
              })
              .catch(() => {});
          }

          return true;
        },
        { maxWait: 5000, timeout: 10000 }
      );

      if (!approved) {
        return NextResponse.json(
          { error: "This deposit has already been processed" },
          { status: 400 }
        );
      }

      const [signinRewards, claimedSigninRewards] = await Promise.all([
        db.signinBonusRewards.findMany(),
        db.claimedSigninReward.findMany({
          where: { userId: deposit.user.id, isClamed: true },
        }),
      ]);

      const lastReward = signinRewards.find((signinReward) => {
        return !claimedSigninRewards.some(
          (claimed) => claimed.rewardId === signinReward.id
        );
      });

      if (lastReward && +deposit.amount >= lastReward.prize) {
        const existingClaim = await db.claimedSigninReward.findFirst({
          where: {
            userId: deposit.userId,
            depositId: deposit.id,
          },
        });

        if (!existingClaim) {
          try {
            await db.claimedSigninReward.create({
              data: {
                userId: deposit.userId,
                rewardId: lastReward.id,
                depositId: deposit.id,
              },
            });
          } catch (e) {
            if (
              !(
                e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === "P2002"
              )
            ) {
              throw e;
            }
          }
        }
      }
    } else if (actionType == "reject") {
      await db.deposit.updateMany({
        where: { id: depositId, status: "PENDING" },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
