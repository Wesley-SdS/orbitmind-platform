import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

const middleware = auth(((req: NextRequest & { auth?: { user?: unknown } }) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/webhooks");

  if (isPublicRoute) return NextResponse.next();

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}) as Parameters<typeof auth>[0]);

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
