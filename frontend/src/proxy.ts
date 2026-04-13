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

  // Handle API proxying (exclude auth routes handled by Next.js)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    // NEXT_PUBLIC_API_URL is "http://localhost:8000/api/v1"
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    
    // Remove the local '/api' prefix and append to backend base
    const targetPath = pathname.replace(/^\/api/, '');
    const url = new URL(backendBase + targetPath);
    url.search = req.nextUrl.search;

    return NextResponse.rewrite(url);
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
