import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/"].includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return;
  }

  if (isPublicRoute) {
    return;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  const { role } = req.auth.user;

  if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (nextUrl.pathname.startsWith("/support") && role !== "SUBADMIN" && role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};