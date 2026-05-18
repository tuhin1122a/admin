"use server";
import { signIn } from "@/auth";
import { SigninSchema } from "@/schema";
import { CredentialsSignin } from "next-auth";

export const signInAction = async (data: SigninSchema) => {
  try {
    const { email, password } = data;
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });

    return { success: true };
  } catch (error) {
    console.log({ error });
    const credentialsError = error as CredentialsSignin;
    return { error: credentialsError?.cause?.err?.message };
  }
};
