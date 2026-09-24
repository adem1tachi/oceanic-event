import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js internal requests, API routes, and static assets pass untouched
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. Run next-intl middleware to handle locale detection and redirection
  const intlResponse = intlMiddleware(request);

  // 2. Refresh Supabase session and verify admin authorization
  const { response, user, isAdmin } = await updateSession(request, intlResponse);

  // 3. Extract locale from the pathname or intl headers
  const segments = pathname.split("/").filter(Boolean);
  const locale = (segments[0] === "ar" || segments[0] === "en") ? segments[0] : routing.defaultLocale;
  const isLoginPage = pathname === `/${locale}/admin/login`;
  const isAdminPath = pathname.startsWith(`/${locale}/admin`);

  // Protect admin routes
  if (isAdminPath) {
    if (!isLoginPage) {
      // If visiting /admin, /admin/projector, etc. without being an authorized admin
      if (!user || !isAdmin) {
        const loginUrl = new URL(`/${locale}/admin/login`, request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      // If user is already an authenticated admin and visits /admin/login, redirect to /admin
      if (user && isAdmin) {
        return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  // Match all request paths except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
