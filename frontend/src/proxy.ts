import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Match protected/auth route segments accounting for locale prefixes (e.g. /en/dashboard)
const PROTECTED_SEGMENTS = ['/dashboard', '/workflow', '/studio', '/projects', '/orgs'];
const AUTH_SEGMENTS = ['/sign-in', '/sign-up'];

function matchesSegment(pathname: string, segments: string[]): boolean {
  return segments.some((seg) => {
    // Match /segment or /locale/segment (e.g. /en/dashboard, /dashboard/settings)
    const pattern = new RegExp(`(^|/[a-z]{2})${seg}(/|$)`);
    return pattern.test(pathname);
  });
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  const isDashboardRoute = matchesSegment(req.nextUrl.pathname, PROTECTED_SEGMENTS);
  const isAuthRoute = matchesSegment(req.nextUrl.pathname, AUTH_SEGMENTS);

  if (isDashboardRoute && !isLoggedIn) {
    return Response.redirect(new URL('/sign-in', req.nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.nextUrl));
  }

  return intlMiddleware(req);
});

export const config = {
  // Matcher ignoring common static files and api routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
