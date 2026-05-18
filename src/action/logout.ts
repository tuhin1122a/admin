"use server";

import { INTERNAL_SERVER_ERROR } from "@/error";
import { signOut } from "@/auth";

export const logout = async () => {
  try {
    await signOut({ redirect: false });

    return { success: true };
  } catch (error) {
    console.log({ error });
    return { error: INTERNAL_SERVER_ERROR };
  }
};
