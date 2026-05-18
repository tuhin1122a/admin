import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { name: "email", type: "email" },
        password: { name: "password", type: "password" },
      },

      async authorize(credentials) {
        const user: string = (credentials!.email as string) || "";
        const password: string = (credentials!.password as string) || "";

        if (!user || !password) {
          throw new Error("Invalid Input Type");
        }

        const account = await db.admin.findUnique({
          where: {
            email: user,
          },
        });

        if (!account) {
          throw new Error("Invalid Credentials");
        }

        const passwordIsMatch = await bcrypt.compare(
          password,
          account.password
        );

        if (!passwordIsMatch) {
          throw new Error("Invalid Credentials");
        }
        return account;
      },
    }),
  ],
} satisfies NextAuthConfig;
