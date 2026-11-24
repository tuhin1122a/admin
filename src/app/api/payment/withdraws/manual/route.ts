import { auth } from "@/auth";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { Prisma, WithdrawStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRole = (session.user as any)?.role;
    const currentAdminId = session.user.id;

    const body = await req.json();
    const {
      userId,
      amount: rawAmount,
      paymentWalletId,
      walletName = "Manual Payout",
      walletNumber,
      accountHolderName,
      status: rawStatus = "APPROVED",
      note,
    } = body;

    const amount = Number(rawAmount);

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Withdraw amount must be greater than 0" },
        { status: 400 }
      );
    }

    const cleanNumber = String(walletNumber || "").trim();
    if (!cleanNumber) {
      return NextResponse.json(
        { error: "Account / Phone number is required for withdrawal" },
        { status: 400 }
      );
    }

    // Fetch user and wallet
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        cardContainer: {
          include: { cards: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "Cannot process withdrawal: User account is suspended." },
        { status: 400 }
      );
    }

    if (user.canWithdraw === false) {
      return NextResponse.json(
        { error: "Withdrawals are currently restricted for this user account by Admin." },
        { status: 400 }
      );
    }

    // Sub-Admin check
    if (
      currentRole === "SUBADMIN" &&
      user.subAdminId &&
      user.subAdminId !== currentAdminId
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only manage your own assigned players" },
        { status: 403 }
      );
    }

    const currentBalance = Number(user.wallet?.balance ?? 0);
    if (currentBalance < amount) {
      return NextResponse.json(
        {
          error: `Insufficient user balance. Current balance is ৳${currentBalance.toFixed(
            2
          )}, but requested withdrawal is ৳${amount.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const withdrawStatus: WithdrawStatus =
      rawStatus === "PENDING" ? WithdrawStatus.PENDING : WithdrawStatus.APPROVED;

    // Resolve or find PaymentWallet
    let effectivePaymentWalletId = paymentWalletId;
    if (effectivePaymentWalletId) {
      const pw = await db.paymentWallet.findUnique({
        where: { id: effectivePaymentWalletId },
      });
      if (!pw) {
        effectivePaymentWalletId = undefined;
      }
    }

    if (!effectivePaymentWalletId) {
      const defaultPw = await db.paymentWallet.findFirst();
      if (defaultPw) {
        effectivePaymentWalletId = defaultPw.id;
      } else {
        // Create a default payment wallet if none exists
        const createdPw = await db.paymentWallet.create({
          data: {
            walletName: walletName || "Cash / Manual",
            walletLogo: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150",
          },
        });
        effectivePaymentWalletId = createdPw.id;
      }
    }

    // Perform database transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Deduct balance from user wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { decrement: amount },
        },
      });

      // 2. Ensure user has a CardContainer
      let containerId = user.cardContainer?.id;
      if (!containerId) {
        const newContainer = await tx.cardContainer.create({
          data: {
            ownerName: accountHolderName || user.name || "Player",
            password: user.withdrawPassword || user.password,
            userId: user.id,
          },
        });
        containerId = newContainer.id;
      }

      // 3. Ensure a Card exists for this number and payment wallet
      let card = await tx.card.findFirst({
        where: {
          containerId: containerId,
          walletNumber: cleanNumber,
        },
      });

      if (!card) {
        card = await tx.card.create({
          data: {
            containerId: containerId,
            cardNumber: cleanNumber,
            walletNumber: cleanNumber,
            paymentWalletid: effectivePaymentWalletId!,
          },
        });
      }

      // 4. Create the Withdraw record
      const withdraw = await tx.withdraw.create({
        data: {
          amount: new Prisma.Decimal(amount),
          status: withdrawStatus,
          expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          cardId: card.id,
          userId: user.id,
        },
      });

      // 5. Notify the user
      await tx.notification.create({
        data: {
          title: "Manual Withdrawal Processed",
          description: `Withdrawal of ৳${amount.toFixed(
            2
          )} has been ${withdrawStatus.toLowerCase()} via ${walletName} (${cleanNumber}).${
            note ? ` Note: ${note}` : ""
          }`,
          userId: user.id,
          metadata: {
            amount,
            type: "manual_withdraw",
            withdrawId: withdraw.id,
            status: withdrawStatus,
            note: note || null,
          },
        },
      });

      return {
        withdraw,
        newBalance: Number(updatedWallet.balance),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Manual withdrawal of ৳${amount.toFixed(
        2
      )} successfully processed for ${user.phone}!`,
      withdraw: result.withdraw,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error("Manual withdraw error:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
