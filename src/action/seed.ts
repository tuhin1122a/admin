"use server";
import { db } from "@/lib/db";

import bcrypt from "bcryptjs";

export const seedAdmin = async (data: {
  email: string;
  name: string;
  password: string;
}) => {
  try {
    const { email, password, name } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.admin.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    await db.bonus.create({
      data: {
        signinBonus: 5,
        referralBonus: 5,
      },
    });

    console.log("OK");
  } catch (error) {
    console.log(error);
    return { error: "Somthing went wrong" };
  }
};
