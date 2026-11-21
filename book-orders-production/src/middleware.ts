import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require license
const publicPaths = [
  "/login",
  "/api/license/validate",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/logo.png",
];

// Admin paths that require admin auth
const adminPaths = ["/license"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For admin paths, let the existing auth handle it
  if (adminPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For all other paths, add header to indicate license required
  // Client-side will check localStorage and redirect if needed
  const response = NextResponse.next();
  response.headers.set("x-license-required", "true");
  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|login).*)",
  ],
};