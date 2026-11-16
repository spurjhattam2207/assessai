import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string } | undefined;
  const educator = pathname.startsWith("/educator");
  const studentApp = pathname.startsWith("/student") || pathname.startsWith("/profile");
  if ((educator || studentApp) && !user) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  if (educator && user?.role && user.role !== "EDUCATOR") {
    return NextResponse.redirect(new URL("/student", req.url));
  }
  if (pathname.startsWith("/student") && user?.role && user.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/educator", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/educator/:path*", "/student/:path*", "/profile/:path*"],
};
