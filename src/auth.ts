import NextAuth from "next-auth";

import authConfig from "./auth.config";

export const { signIn, signOut, auth, handlers } = NextAuth({
  trustHost: true,
  ...authConfig,
  secret:
    process.env.AUTH_SECRET ||
    "e937d57fc5ad23b7235db0e9cc8e3a2dcf0251918a09cfbe56df0473b185faef",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  cookies: {
    sessionToken: {
      name: "adminx.session-token",
    },
    callbackUrl: {
      name: "adminx.callback-url",
    },
    csrfToken: {
      name: "adminx.csrf-token",
    },
  },
  logger: {
    error(error) {
      if ((error as { type?: string })?.type === "JWTSessionError") {
        console.warn("[adminx auth] Ignoring undecryptable/expired session cookie.");
        return;
      }
      console.error("[adminx auth][error]", error);
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.agentCode = (user as any).agentCode;
      }
      return token;
    },
    async session({ token, session }: { token: any; session: any }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.agentCode = token.agentCode;
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
