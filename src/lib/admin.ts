import { db } from "./db";
import { auth } from "@/auth";

export const findAdmin = async () => await db.admin.findFirst({ where: {} });
export const findCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};
