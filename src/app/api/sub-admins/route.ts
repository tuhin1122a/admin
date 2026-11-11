import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentId = session?.user?.id;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://rk444.site";

    // If Sub-Admin, they can only see their own profile and referral stats
    const where: any = currentRole === "SUBADMIN"
      ? { id: currentId }
      : { role: "SUBADMIN" };

    const subAdmins = await db.admin.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const subAdminIds = subAdmins.map((s) => s.id);

    // Get player counts per sub-admin
    const usersBySubAdmin = await db.user.groupBy({
      by: ["subAdminId"],
      where: { subAdminId: { in: subAdminIds } },
      _count: { id: true },
    });
    const playerCounts = new Map<string, number>();
    for (const u of usersBySubAdmin) {
      if (u.subAdminId) playerCounts.set(u.subAdminId, u._count.id);
    }

    // Get custom wallet count per sub-admin
    const walletsBySubAdmin = await db.depositWallet.groupBy({
      by: ["subAdminId"],
      where: { subAdminId: { in: subAdminIds } },
      _count: { id: true },
    });
    const walletCounts = new Map<string, number>();
    for (const w of walletsBySubAdmin) {
      if (w.subAdminId) walletCounts.set(w.subAdminId, w._count.id);
    }

    // Get total deposits & withdrawals for players of each sub-admin
    const [depositSums, withdrawSums] = await Promise.all([
      db.deposit.groupBy({
        by: ["userId"],
        where: {
          status: "APPROVED",
          user: { subAdminId: { in: subAdminIds } },
        },
        _sum: { amount: true },
      }),
      db.withdraw.groupBy({
        by: ["userId"],
        where: {
          status: "APPROVED",
          user: { subAdminId: { in: subAdminIds } },
        },
        _sum: { amount: true },
      }),
    ]);

    // Map users to their subAdminId
    const taggedUsers = await db.user.findMany({
      where: { subAdminId: { in: subAdminIds } },
      select: { id: true, subAdminId: true },
    });
    const userToAgentMap = new Map<string, string>();
    for (const u of taggedUsers) {
      if (u.subAdminId) userToAgentMap.set(u.id, u.subAdminId);
    }

    const agentDeposits = new Map<string, number>();
    for (const d of depositSums) {
      const agentId = userToAgentMap.get(d.userId);
      if (agentId) {
        agentDeposits.set(
          agentId,
          (agentDeposits.get(agentId) ?? 0) + Number(d._sum.amount ?? 0)
        );
      }
    }

    const agentWithdraws = new Map<string, number>();
    for (const w of withdrawSums) {
      const agentId = userToAgentMap.get(w.userId);
      if (agentId) {
        agentWithdraws.set(
          agentId,
          (agentWithdraws.get(agentId) ?? 0) + Number(w._sum.amount ?? 0)
        );
      }
    }

    const formatted = subAdmins.map((sub) => {
      const code = sub.agentCode || `AGT${sub.id.slice(-4).toUpperCase()}`;
      const totalDep = agentDeposits.get(sub.id) ?? 0;
      const totalWd = agentWithdraws.get(sub.id) ?? 0;
      return {
        id: sub.id,
        name: sub.name,
        email: sub.email,
        role: sub.role,
        agentCode: code,
        phone: sub.phone || "",
        isActive: sub.isActive,
        commissionRate: Number(sub.commissionRate ?? 0),
        referralLink: `${siteUrl.replace(/\/+$/, "")}/register?agent=${code}`,
        playerCount: playerCounts.get(sub.id) ?? 0,
        customWalletsCount: walletCounts.get(sub.id) ?? 0,
        totalDeposits: totalDep,
        totalWithdraws: totalWd,
        netProfit: totalDep - totalWd,
        createdAt: sub.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      subAdmins: formatted,
      isSubAdminView: currentRole === "SUBADMIN",
    });
  } catch (error: any) {
    console.error("Error fetching sub-admins:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch sub-admins" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can create new Sub-Admins." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, agentCode, phone, commissionRate = 0 } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    const existingEmail = await db.admin.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An admin or sub-admin with this email already exists." },
        { status: 400 }
      );
    }

    let finalAgentCode = String(
      agentCode || `AGT${Math.floor(1000 + Math.random() * 9000)}`
    )
      .trim()
      .toUpperCase();

    // Check agent code uniqueness
    const existingCode = await db.admin.findUnique({
      where: { agentCode: finalAgentCode },
    });
    if (existingCode) {
      finalAgentCode = `${finalAgentCode}${Math.floor(10 + Math.random() * 90)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSubAdmin = await db.admin.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: hashedPassword,
        role: "SUBADMIN",
        agentCode: finalAgentCode,
        phone: phone ? String(phone).trim() : null,
        commissionRate: Number(commissionRate) || 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sub-Admin agent created successfully!",
      subAdmin: {
        id: newSubAdmin.id,
        name: newSubAdmin.name,
        email: newSubAdmin.email,
        agentCode: newSubAdmin.agentCode,
      },
    });
  } catch (error: any) {
    console.error("Error creating sub-admin:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create sub-admin" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentId = session?.user?.id;

    const body = await req.json();
    const { id, name, phone, agentCode, isActive, commissionRate, newPassword } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing sub-admin ID" }, { status: 400 });
    }

    // Sub-Admin can only update their own phone or name, not active/commission or other agents
    if (currentRole === "SUBADMIN" && currentId !== id) {
      return NextResponse.json(
        { error: "Unauthorized to edit other agents" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;

    if (currentRole === "ADMIN") {
      if (agentCode) updateData.agentCode = String(agentCode).trim().toUpperCase();
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (commissionRate !== undefined) updateData.commissionRate = Number(commissionRate);
    }

    if (newPassword && String(newPassword).trim().length >= 6) {
      updateData.password = await bcrypt.hash(String(newPassword).trim(), 10);
    }

    const updated = await db.admin.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Sub-Admin updated successfully",
      subAdmin: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update sub-admin" },
      { status: 500 }
    );
  }
}

