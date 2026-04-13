import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_SEGMENTS = ['/dashboard', '/workflow', '/studio', '/projects', '/orgs',
  '/creative-studio', '/creator', '/history', '/invites', '/settings', '/stock',
  '/assistant', '/community', '/design-system', '/workflows'];
const AUTH_SEGMENTS = ['/sign-in', '/sign-up'];

function matchesSegment(pathname: string, segments: string[]): boolean {
  return segments.some((seg) => {
    const pattern = new RegExp(`(^|/[a-z]{2})${seg}(/|$)`);
    return pattern.test(pathname);
  });
}

// Do not rely on auth wrapper which causes weird redirect loop with next-intl.
// Manually get session.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip intl processing for API routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Handle i18n routing first which returns a response
  const res = intlMiddleware(req);

  // Note: we can't easily wait for auth session without the wrapper if we are not in an edge runtime where it's supported without wrapper.
  // Wait, NextAuth beta v5 auth() can be called as a function.
  // Actually, we can just return the intl middleware response directly for now to isolate the issue.
  return res;
}

export const config = {
  // Matcher ignoring common static files and api routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
