import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import sessionService from "@/modules/auth/session.service";

const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(sessionService.cookieName)?.value;
  const session = await sessionService.decrypt(token);
  const isAuthenticated = !!session?.userId;
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest).*)",
  ],
};
