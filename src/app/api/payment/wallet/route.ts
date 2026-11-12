import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { WalletCreateInput, WalletUpdateInput } from "@/type/payment";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRole = (session.user as any)?.role;
    const currentAdminId = session.user.id;

    const body = (await req.json()) as WalletCreateInput;
    const {
      paymentWalletId,
      walletLogo,
      walletName,
      walletType,
      wallets,
      isActive,
      subAdminId,
      minDeposit,
      maxDeposit,
      trxType,
      instructions,
      warning,
    } = body;

    const cleanWallets = (wallets || [])
      .map((w) => String(w).trim())
      .filter(Boolean);

    if (cleanWallets.length === 0) {
      return NextResponse.json(
        { error: "At least one wallet number is required" },
        { status: 400 }
      );
    }

    const effectiveSubAdminId =
      currentRole === "SUBADMIN"
        ? currentAdminId || null
        : subAdminId && subAdminId !== "default" && subAdminId !== "all"
        ? subAdminId
        : null;

    if (effectiveSubAdminId && currentRole === "ADMIN") {
      const targetAgent = await db.admin.findFirst({
        where: { id: effectiveSubAdminId, role: "SUBADMIN" },
        select: { id: true },
      });
      if (!targetAgent) {
        return NextResponse.json(
          { error: "Selected Sub-Admin was not found" },
          { status: 404 }
        );
      }
    }

    // Resolve or create PaymentWallet (reuse existing preset if matching)
    let resolvedPaymentWallet = paymentWalletId
      ? await db.paymentWallet.findUnique({ where: { id: paymentWalletId } })
      : null;

    if (!resolvedPaymentWallet && walletName) {
      resolvedPaymentWallet = await db.paymentWallet.findFirst({
        where: {
          walletName: { equals: walletName.trim(), mode: "insensitive" },
          walletType: walletType,
        },
      });
    }

    // Check duplicate numbers within same sub-admin and wallet type
    const existingMatchingPaymentWallets = await db.paymentWallet.findMany({
      where: {
        walletName: {
          equals: (resolvedPaymentWallet?.walletName || walletName).trim(),
          mode: "insensitive",
        },
        walletType: resolvedPaymentWallet?.walletType || walletType,
      },
      select: { id: true },
    });

    const existingWalletsId = existingMatchingPaymentWallets.map((w) => w.id);

    if (existingWalletsId.length > 0) {
      const existingDepositWallet = await db.depositWallet.findMany({
        where: {
          paymentWalletId: { in: existingWalletsId },
          walletsNumber: { hasSome: cleanWallets },
          subAdminId: effectiveSubAdminId,
        },
      });

      if (existingDepositWallet.length > 0) {
        return NextResponse.json(
          {
            error:
              "Wallet Number already exists for this payment method under this account",
          },
          { status: 400 }
        );
      }
    }

    if (!resolvedPaymentWallet) {
      resolvedPaymentWallet = await db.paymentWallet.create({
        data: {
          walletLogo: walletLogo || "",
          walletName: walletName.trim(),
          walletType: walletType || "EWALLET",
        },
      });
    }

    const parsedMin = Number(minDeposit);
    const parsedMax = Number(maxDeposit);
    const safeMin =
      Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin : 100;
    const safeMax =
      Number.isFinite(parsedMax) && parsedMax >= safeMin ? parsedMax : 25000;

    await db.depositWallet.create({
      data: {
        paymentWalletId: resolvedPaymentWallet.id,
        walletsNumber: cleanWallets,
        instructions: instructions?.trim() || "",
        warning: warning?.trim() || "",
        trxType: trxType?.trim() || "send-money",
        minDeposit: safeMin,
        maximumDeposit: safeMax,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        subAdminId: effectiveSubAdminId,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create payment wallet error:", error);
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
    let targetSubAdmin: {
      id: string;
      name: string;
      agentCode: string | null;
      email: string;
    } | null = null;

    if (currentRole === "SUBADMIN") {
      targetSubAdminId = currentAdminId || null;
      if (targetSubAdminId) {
        targetSubAdmin = await db.admin.findUnique({
          where: { id: targetSubAdminId },
          select: { id: true, name: true, agentCode: true, email: true },
        });
      }
    } else if (
      subAdminIdParam &&
      subAdminIdParam !== "default" &&
      subAdminIdParam !== "all"
    ) {
      targetSubAdminId = subAdminIdParam;
      targetSubAdmin = await db.admin.findUnique({
        where: { id: subAdminIdParam },
        select: { id: true, name: true, agentCode: true, email: true },
      });
    } else if (agentCode) {
      const agent = await db.admin.findFirst({
        where: {
          role: "SUBADMIN",
          isActive: true,
          agentCode: { equals: agentCode.trim(), mode: "insensitive" },
        },
        select: { id: true, name: true, agentCode: true, email: true },
      });
      if (agent) {
        targetSubAdminId = agent.id;
        targetSubAdmin = agent;
      }
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

    // Build deduplicated preset templates for quick gateway creation
    const seenTemplateKeys = new Set<string>();
    const templates = paymentWallets.filter((pw) => {
      const key = `${pw.walletName.trim().toLowerCase()}::${pw.walletType}`;
      if (seenTemplateKeys.has(key)) return false;
      seenTemplateKeys.add(key);
      return true;
    });

    let depositsWallets: any[] = [];
    if (targetSubAdminId) {
      depositsWallets = await db.depositWallet.findMany({
        where: { subAdminId: targetSubAdminId },
        include: {
          subAdmin: {
            select: { id: true, name: true, agentCode: true },
          },
        },
      });
      // For unauthenticated player lookups, fall back to default wallets if agent hasn't configured active ones
      if (!session?.user) {
        const configuredActive = depositsWallets.filter(
          (w) =>
            w.isActive &&
            Array.isArray(w.walletsNumber) &&
            w.walletsNumber.some((n: string) => String(n).trim().length > 0)
        );
        if (configuredActive.length === 0) {
          depositsWallets = await db.depositWallet.findMany({
            where: { subAdminId: null, isActive: true },
          });
        } else {
          depositsWallets = configuredActive;
        }
      }
    } else if (currentRole === "ADMIN") {
      depositsWallets = await db.depositWallet.findMany({
        where: subAdminIdParam === "all" ? {} : { subAdminId: null },
        include: {
          subAdmin: {
            select: { id: true, name: true, agentCode: true },
          },
        },
      });
    } else {
      depositsWallets = await db.depositWallet.findMany({
        where: { subAdminId: null, isActive: true },
      });
    }

    const subAdmins =
      currentRole === "ADMIN"
        ? await db.admin.findMany({
            where: { role: "SUBADMIN" },
            select: { id: true, name: true, agentCode: true },
            orderBy: { createdAt: "desc" },
          })
        : undefined;

    const allWallets = depositsWallets.map((dw) => {
      const paymentWallet = paymentWallets.find(
        (w) => w.id === dw.paymentWalletId
      );
      return { ...dw, paymentWallet };
    });

    return NextResponse.json(
      {
        data: {
          wallets: allWallets,
          templates,
          targetSubAdmin,
          subAdmins,
          isSubAdminView: currentRole === "SUBADMIN",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch payment wallets error:", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentRole = (session.user as any)?.role;
    const currentAdminId = session.user.id;

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
      return NextResponse.json({ error: "Invalid input type" }, { status: 400 });
    }

    const dpWallet = await db.depositWallet.findUnique({ where: { id } });
    if (!dpWallet)
      return NextResponse.json({ error: "Wallet Not Found" }, { status: 404 });

    if (currentRole === "SUBADMIN" && dpWallet.subAdminId !== currentAdminId) {
      return NextResponse.json(
        { error: "Forbidden: cannot modify another account's wallet" },
        { status: 403 }
      );
    }

    const payload: Prisma.DepositWalletUpdateInput = {
      maximumDeposit: maxDeposit,
      minDeposit: minDeposit,
      trxType: trxType,
      isActive: isActive,
    };

    if (instructions !== undefined) {
      payload.instructions = instructions;
    }
    if (warning !== undefined) {
      payload.warning = warning;
    }

    if (wallets) {
      payload.walletsNumber = wallets.map((w) => String(w).trim()).filter(Boolean);
    }

    await db.depositWallet.update({ where: { id }, data: payload });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Update payment wallet error:", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentRole = (session.user as any)?.role;
    const currentAdminId = session.user.id;

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Wallet ID is required" }, { status: 400 });
    }

    const dpWallet = await db.depositWallet.findUnique({ where: { id } });
    if (!dpWallet) {
      return NextResponse.json({ error: "Wallet Not Found" }, { status: 404 });
    }

    if (currentRole === "SUBADMIN" && dpWallet.subAdminId !== currentAdminId) {
      return NextResponse.json(
        { error: "Forbidden: cannot delete another account's wallet" },
        { status: 403 }
      );
    }

    await db.depositWallet.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE wallet error:", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
