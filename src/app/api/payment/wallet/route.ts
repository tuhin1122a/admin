import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { WalletCreateInput, WalletUpdateInput } from "@/type/payment";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentAdminId = session?.user?.id;

    const body = (await req.json()) as WalletCreateInput & { subAdminId?: string };
    const { walletLogo, walletName, walletType, wallets, isActive, subAdminId } = body;

    const effectiveSubAdminId =
      currentRole === "SUBADMIN" ? currentAdminId : subAdminId || null;

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
        subAdminId: effectiveSubAdminId,
      },
    });

    if (existingDepositWallet.length > 0) {
      return Response.json(
        {
          error:
            "Wallet Number is already available with the same Payment wallet type",
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
        subAdminId: effectiveSubAdminId,
      },
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const agentCode = searchParams.get("agentCode");
    const subAdminIdParam = searchParams.get("subAdminId");

    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentAdminId = session?.user?.id;

    let targetSubAdminId: string | null = null;

    if (currentRole === "SUBADMIN") {
      targetSubAdminId = currentAdminId || null;
    } else if (subAdminIdParam) {
      targetSubAdminId = subAdminIdParam;
    } else if (agentCode) {
      const agent = await db.admin.findUnique({
        where: { agentCode: agentCode.trim().toUpperCase() },
      });
      if (agent) targetSubAdminId = agent.id;
    } else if (userId) {
      const user = await db.user.findFirst({
        where: {
          OR: [{ id: userId }, { playerId: userId }, { phone: userId }],
        },
        select: { subAdminId: true },
      });
      if (user?.subAdminId) targetSubAdminId = user.subAdminId;
    }

    const paymentWallets = await db.paymentWallet.findMany();

    let depositsWallets: any[] = [];
    if (targetSubAdminId) {
      // Find sub-admin's custom wallets
      depositsWallets = await db.depositWallet.findMany({
        where: { subAdminId: targetSubAdminId },
      });
      // Fallback to default if sub-admin hasn't configured custom wallets yet (for players)
      if (depositsWallets.length === 0 && !session?.user) {
        depositsWallets = await db.depositWallet.findMany({
          where: { subAdminId: null },
        });
      }
    } else if (currentRole === "ADMIN") {
      // Super admin sees all wallets
      depositsWallets = await db.depositWallet.findMany();
    } else {
      // Default platform wallets (for direct users)
      depositsWallets = await db.depositWallet.findMany({
        where: { subAdminId: null },
      });
    }

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
