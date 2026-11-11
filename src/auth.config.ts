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

        const identifier = user.trim();

        // Support login by email, agentCode, or phone
        const account = await db.admin.findFirst({
          where: {
            OR: [
              { email: identifier.toLowerCase() },
              { agentCode: identifier.toUpperCase() },
              { phone: identifier },
            ],
          },
        });

        if (!account) {
          throw new Error("Invalid Credentials");
        }

        // Sub-Admin account active check
        if (account.role === "SUBADMIN" && account.isActive === false) {
          throw new Error("Your account has been deactivated. Contact admin.");
        }

        const passwordIsMatch = await bcrypt.compare(
          password,
          account.password
        );

        if (!passwordIsMatch) {
          throw new Error("Invalid Credentials");
        }

        // Return all needed fields explicitly for JWT token
        return {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          agentCode: account.agentCode,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
