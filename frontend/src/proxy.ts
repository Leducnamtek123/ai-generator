import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminRole } from "@/lib/access-control";

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

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isWorkflowEditorAlias(pathname: string): boolean {
  return pathname === "/workflow-editor";
}

function getRedirectUrl(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return url;
}

// Do not rely on auth wrapper which causes weird redirect loop with next-intl.
// Manually get session.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isWorkflowEditorAlias(pathname)) {
    const url = req.nextUrl.clone();
    const locale = req.cookies.get("NEXT_LOCALE")?.value || routing.defaultLocale;
    url.pathname = `/${locale}/creator/workflow-editor`;
    return NextResponse.rewrite(url);
  }

  if (isAdminRoute(pathname)) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token?.accessToken) {
      const signInUrl = getRedirectUrl(req, "/sign-in");
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (!isAdminRole(token.role)) {
      return NextResponse.redirect(getRedirectUrl(req, "/dashboard"));
    }
  }

  // Handle API proxying (exclude only NextAuth routes handled by Next.js)
  if (pathname.startsWith('/api') && !isNextAuthRoute(pathname)) {
    const billingBase =
      process.env.BILLING_API_URL ||
      process.env.NEXT_PUBLIC_BILLING_API_URL ||
      process.env.INTERNAL_API_URL ||
      process.env.API_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost/api/v1';
    const generationBase =
      process.env.GENERATION_API_URL ||
      process.env.NEXT_PUBLIC_GENERATION_API_URL ||
      process.env.INTERNAL_API_URL ||
      process.env.API_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost/api/v1';
    const gatewayBase =
      process.env.INTERNAL_API_URL ||
      process.env.API_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8000/api/v1';
    const communityBase =
      process.env.COMMUNITY_API_URL ||
      process.env.NEXT_PUBLIC_COMMUNITY_API_URL ||
      process.env.INTERNAL_API_URL ||
      process.env.API_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      gatewayBase;

    const isBillingRoute =
      pathname.startsWith('/api/payments') || pathname.startsWith('/api/credits');
    const isGenerationRoute =
      pathname.startsWith('/api/generations') ||
      pathname.startsWith('/api/queues') ||
      pathname.startsWith('/api/workflows');
    const isCommunityRoute = pathname.startsWith('/api/community-marketplace');
    const backendBase = isBillingRoute
      ? billingBase
      : isGenerationRoute
        ? generationBase
        : isCommunityRoute
          ? communityBase
        : gatewayBase;

    // Remove the local API prefix and append to the configured backend base.
    // Handle both `/api/...` and `/api/v1/...` so proxied file URLs do not get
    // a duplicated `/v1` segment.
    const targetPath = pathname.startsWith('/api/v1/')
      ? pathname.replace(/^\/api\/v1/, '')
      : pathname.replace(/^\/api/, '');
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
  // Matcher ignoring common static files but including API routes for proxying
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|gif|webp|ico)$).*)",
  ],
};
