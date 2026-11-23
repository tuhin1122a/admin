import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

// GET all admin accounts (Mother Admins & Sub-Admins)
export async function GET() {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;

    if (currentRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const accounts = await db.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agentCode: true,
        phone: true,
        isActive: true,
        commissionRate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      accounts: accounts.map((a) => ({
        ...a,
        commissionRate: Number(a.commissionRate),
        createdAt: a.createdAt.toISOString(),
      })),
      currentUserId: session?.user?.id,
    });
  } catch (error: any) {
    console.error("Error fetching admin accounts:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST create a new Mother Admin (ADMIN) or Sub-Admin (SUBADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;

    if (currentRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "ADMIN",
      phone,
      agentCode,
      commissionRate = 0,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || String(password).trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check duplicate email
    const existing = await db.admin.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // If sub-admin, check agentCode
    let code: string | null = null;
    if (role === "SUBADMIN") {
      code = agentCode ? String(agentCode).trim().toUpperCase() : `AGT${Math.floor(1000 + Math.random() * 9000)}`;
      const existingCode = await db.admin.findUnique({
        where: { agentCode: code },
      });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: `Agent Code ${code} is already in use` },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

    const newAdmin = await db.admin.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role === "SUBADMIN" ? "SUBADMIN" : "ADMIN",
        agentCode: code,
        phone: phone ? String(phone).trim() : null,
        commissionRate: Number(commissionRate) || 0,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agentCode: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${role === "ADMIN" ? "Mother Admin" : "Sub-Admin"} account created successfully!`,
      account: newAdmin,
    });
  } catch (error: any) {
    console.error("Error creating admin account:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

// DELETE an admin or sub-admin account
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const currentRole = (session?.user as any)?.role;
    const currentId = session?.user?.id;

    if (currentRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Safety 1: Cannot delete oneself
    if (id === currentId) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own currently logged-in account!" },
        { status: 400 }
      );
    }

    const target = await db.admin.findUnique({
      where: { id },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    // Safety 2: If target is Mother Admin (ADMIN), ensure at least 1 other Mother Admin remains
    if (target.role === "ADMIN") {
      const adminCount = await db.admin.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot delete the last remaining Mother Admin account in the system!",
          },
          { status: 400 }
        );
      }
    }

    // If sub-admin, unlink their players and delete custom wallets first to prevent foreign key errors
    if (target.role === "SUBADMIN") {
      await db.user.updateMany({
        where: { subAdminId: id },
        data: { subAdminId: null },
      });
      await db.depositWallet.deleteMany({
        where: { subAdminId: id },
      });
    }

    await db.admin.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `${target.role === "ADMIN" ? "Mother Admin" : "Sub-Admin"} account deleted successfully!`,
    });
  } catch (error: any) {
    console.error("Error deleting admin account:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
