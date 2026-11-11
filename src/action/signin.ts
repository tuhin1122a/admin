"use server";
import { signIn } from "@/auth";
import { SigninSchema } from "@/schema";

export const signInAction = async (data: SigninSchema) => {
  try {
    const { email, password } = data;
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      return { error: result.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error("signInAction error:", error);
    const msg =
      error?.cause?.err?.message ||
      error?.message ||
      "Invalid email/agent code or password";
    return { error: msg };
  }
};
