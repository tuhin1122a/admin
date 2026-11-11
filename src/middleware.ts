import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    "e937d57fc5ad23b7235db0e9cc8e3a2dcf0251918a09cfbe56df0473b185faef",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [],
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
});

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute =
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/api/softapi/callback");
  const isPublicRoute = ["/"].includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return;
  }

  if (isPublicRoute) {
    return;
  }

  if (!isLoggedIn || !req.auth) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  const { role } = req.auth.user as any;

  // Protect Super-Admin-only features from sub-admins
  const superAdminOnlyPaths = ["/casino-api", "/site", "/recharge"];
  const isSuperAdminOnly = superAdminOnlyPaths.some(
    (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`)
  );
  if (isSuperAdminOnly && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (
    nextUrl.pathname.startsWith("/support") &&
    role !== "SUBADMIN" &&
    role !== "ADMIN"
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
