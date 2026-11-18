import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "cms_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isValid = false;
  if (sessionToken) {
    try {
      const secret = process.env.AUTH_SECRET || "default_fallback_secret_32_characters_minimum_len";
      const key = new TextEncoder().encode(secret);
      await jwtVerify(sessionToken, key, { algorithms: ["HS256"] });
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!isValid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && isValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
