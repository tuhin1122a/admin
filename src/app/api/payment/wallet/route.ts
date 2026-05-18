import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { WalletCreateInput, WalletUpdateInput } from "@/type/payment";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { walletLogo, walletName, walletType, wallets, isActive } =
      (await req.json()) as WalletCreateInput;

    const existingWallet = await db.paymentWallet.findMany({
      where: {
        AND: [
          {
            walletName: walletName.toLowerCase(),
          },
          {
            walletType: walletType,
          },
        ],
      },
      select: { id: true },
    });

    const existingWalletsId = existingWallet.map((wallet) => wallet.id);

    const existingDepositWallet = await db.depositWallet.findMany({
      where: {
        paymentWalletId: { in: [...existingWalletsId!] },
        walletsNumber: {
          hasSome: wallets,
        },
      },
    });

    if (existingDepositWallet.length > 0) {
      return Response.json(
        {
          error:
            "Wallet Number is already availabel with a same Payment wallet type",
        },
        { status: 400 }
      );
    }

    const payload: Prisma.PaymentWalletCreateInput = {
      walletLogo: "",
      walletName: "",
    };

    if (walletLogo) {
      payload.walletLogo = walletLogo;
    }

    if (walletName) {
      payload.walletName = walletName.toLowerCase();
    }

    if (walletType) {
      payload.walletType = walletType;
    }

    const paymentWallet = await db.paymentWallet.create({ data: payload });

    await db.depositWallet.create({
      data: {
        paymentWalletId: paymentWallet.id,
        walletsNumber: wallets,
        instructions: "",
        warning: "",
        trxType: "",
        minDeposit: 0.0,
        maximumDeposit: 0.0,
        isActive,
      },
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const GET = async () => {
  try {
    const paymentWallets = await db.paymentWallet.findMany({
      where: {},
    });

    const depositsWallets = await db.depositWallet.findMany({ where: {} });

    const allWallets = depositsWallets.map((dw) => {
      const paymentWallet = paymentWallets.find(
        (w) => w.id === dw.paymentWalletId
      );

      return { ...dw, paymentWallet };
    });

    return Response.json({ data: { wallets: allWallets } }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const {
      id,
      maxDeposit,
      minDeposit,
      trxType,
      instructions,
      isActive,
      wallets,
      warning,
    } = (await req.json()) as WalletUpdateInput;
    if (
      maxDeposit === undefined ||
      minDeposit === undefined ||
      !trxType ||
      !id
    ) {
      return Response.json({ error: "Invalid input type" }, { status: 400 });
    }

    const dpWallet = await db.depositWallet.findUnique({ where: { id } });
    if (!dpWallet)
      return Response.json({ error: "Wallet Not Found" }, { status: 404 });

    const payload: Prisma.DepositWalletUpdateInput = {
      maximumDeposit: maxDeposit,
      minDeposit: minDeposit,
      trxType: trxType,
      isActive: isActive,
    };

    if (instructions) {
      payload.instructions = instructions;
    }
    if (warning) {
      payload.warning = warning;
    }

    if (wallets) {
      payload.walletsNumber = wallets;
    }

    await db.depositWallet.update({ where: { id }, data: payload });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const { id } = await req.json();
    await db.depositWallet.delete({ where: { id } });
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE : ", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
