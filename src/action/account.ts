"use server";

import { INTERNAL_SERVER_ERROR } from "@/error";
import { findAdmin, findCurrentUser } from "@/lib/admin";
import { db } from "@/lib/db";
import { sendAdminVerificationTokenMail } from "@/lib/email";
import { createAdminVerificationToken, generateOTP } from "@/lib/helpers";
import {
  EmailChangeSchema,
  NameChangeSchema,
  PasswordChangeSchema,
} from "@/schema";

import bcrypt from "bcryptjs";

export const nameChange = async (data: NameChangeSchema) => {
  try {
    const { name } = data;

    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    await db.admin.update({
      where: { id: admin.id },
      data: {
        name,
      },
    });
    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const passwordChange = async (data: PasswordChangeSchema) => {
  try {
    const { currentPassword, newPassword } = data;
    const sessionUser = await findCurrentUser();
    if (!sessionUser?.id) return { error: "Authentication failed. Please log in." };

    const admin = await db.admin.findUnique({
      where: { id: sessionUser.id },
    });
    if (!admin) return { error: "Admin account not found" };

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isPasswordMatch) {
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const sentVerificationMail = async () => {
  try {
    const admin = await findCurrentUser();
    if (!admin?.id || !admin?.email) return { error: "Authentication failed. Please log in." };

    const token = generateOTP(6);

    const tokenHasCreated = await createAdminVerificationToken(token);

    if (!tokenHasCreated) {
      return { error: "Failed to generate verification token" };
    }

    const sent = await sendAdminVerificationTokenMail(admin.email, token);

    return {
      success: true,
      devNote: !sent,
      token: process.env.NODE_ENV !== "production" || !sent ? token : undefined,
    };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const emailChange = async (data: EmailChangeSchema) => {
  try {
    const { newEmail, token } = data;

    const admin = await findCurrentUser();
    if (!admin?.id) return { error: "Authentication failed. Please log in." };

    const targetEmail = newEmail.trim().toLowerCase();

    // Check if new email is already used by another admin
    const existingAdmin = await db.admin.findUnique({
      where: { email: targetEmail },
    });
    if (existingAdmin && existingAdmin.id !== admin.id) {
      return { error: "This email address is already in use by another admin." };
    }

    const existingToken = await db.emailVerificationToken.findFirst({
      where: { token: token.trim() },
    });

    if (!existingToken) {
      return { error: "Invalid verification code" };
    }

    if (token.trim() !== existingToken.token) {
      return { error: "Wrong verification code" };
    }

    if (new Date() > new Date(existingToken.expire)) {
      return { error: "Verification code has expired. Please request a new one." };
    }

    await db.emailVerificationToken.delete({
      where: { id: existingToken.id },
    });

    await db.admin.update({
      where: { id: admin.id },
      data: { email: targetEmail },
    });
    return { success: true };
  } catch (err: any) {
    console.error("emailChange error:", err);
    return { error: INTERNAL_SERVER_ERROR };
  }
};
