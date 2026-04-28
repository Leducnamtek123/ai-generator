import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const intlMiddleware = createMiddleware(routing);

const NEXT_AUTH_ACTIONS = new Set([
  "signin",
  "signout",
  "callback",
  "session",
  "csrf",
  "providers",
  "error",
  "verify-request",
]);

function isNextAuthRoute(pathname: string): boolean {
  if (!pathname.startsWith("/api/auth")) return false;

  const action = pathname.slice("/api/auth".length).split("/").filter(Boolean)[0];
  return !action || NEXT_AUTH_ACTIONS.has(action);
}


// Do not rely on auth wrapper which causes weird redirect loop with next-intl.
// Manually get session.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle API proxying (exclude only NextAuth routes handled by Next.js)
  if (pathname.startsWith('/api') && !isNextAuthRoute(pathname)) {
    // API_BACKEND_URL is a server-only runtime env var (not baked at build time)
    const backendBase = process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    
    // Remove the local '/api' prefix and append to backend base
    const targetPath = pathname.replace(/^\/api/, '');
    const url = new URL(backendBase + targetPath);
    url.search = req.nextUrl.search;

    const headers = new Headers(req.headers);
    const hasAuthHeader = headers.has("authorization");

    if (!hasAuthHeader) {
      const token = await getToken({ req, secret: process.env.AUTH_SECRET });
      const accessToken = token?.accessToken as string | undefined;
      if (accessToken) {
        headers.set("authorization", `Bearer ${accessToken}`);
      }
    }

    console.log(
      `[PROXY] Forwarding ${pathname} to ${url.toString()} with AuthHeader: ${headers.has("authorization")}`
    );

    return NextResponse.rewrite(url, {
      request: {
        headers,
      },
    });
  }

  // Skip intl processing for API routes and system routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Handle i18n routing first which returns a response
  const res = intlMiddleware(req);

  return res;
}

export const config = {
  // Matcher ignoring common static files but INCLUDING api routes for proxying
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
