import NextAuth from "next-auth";

import authConfig from "./auth.config";

export const { signIn, signOut, auth, handlers } = NextAuth({
  trustHost: true,
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ token, session }: { token: any; session: any }) {
      if (token.sub && session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  // cookies: {
  //   sessionToken: {
  //     name: `__Secure-next-auth.session-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       secure: process.env.NODE_ENV === "production",
  //     },
  //   },
  // },
});
