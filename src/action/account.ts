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
    const admin = await findAdmin();
    if (!admin) return { error: "Authentication failed" };

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
    if (!admin) return { error: "Authentication failed" };

    const token = generateOTP(6);

    const tokenHasCreated = await createAdminVerificationToken(token);

    if (!tokenHasCreated) {
      throw Error;
    }

    await sendAdminVerificationTokenMail(admin.email, token);

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const emailChange = async (data: EmailChangeSchema) => {
  try {
    const { newEmail, token } = data;

    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    const existingToken = await db.emailVerificationToken.findFirst({
      where: { token: token },
    });

    if (!existingToken) {
      return { error: "Invalid Try" };
    }

    if (token !== existingToken?.token) {
      return { error: "Wrong token" };
    }

    if (new Date() > new Date(existingToken!.expire)) {
      return { error: "Token was Expired" };
    }

    await db.emailVerificationToken.delete({
      where: { id: existingToken.id },
    });

    await db.admin.update({
      where: { id: admin.id },
      data: { email: newEmail },
    });
    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};
