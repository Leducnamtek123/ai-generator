import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  // Define protected routes
  const isDashboardRoute =
    req.nextUrl.pathname.includes('/dashboard') ||
    req.nextUrl.pathname.includes('/workflow') ||
    req.nextUrl.pathname.includes('/studio') ||
    req.nextUrl.pathname.includes('/projects'); // specific match

  // Define auth routes to redirect away from if logged in
  const isAuthRoute =
    req.nextUrl.pathname.includes('/sign-in') ||
    req.nextUrl.pathname.includes('/sign-up');

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

