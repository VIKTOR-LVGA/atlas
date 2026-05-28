import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

const productRoutes = [
  "/dashboard",
  "/policies",
  "/analysis",
  "/market",
  "/recommendations",
  "/documents",
  "/consulting",
  "/settings",
];

function isRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function redirectWithAuthCookies(
  request: NextRequest,
  path: string,
  authResponse: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);
  authResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let authResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        authResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          authResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (!user && productRoutes.some((route) => isRoute(pathname, route))) {
    return redirectWithAuthCookies(request, "/login", authResponse);
  }

  const authEntryRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  if (
    user &&
    authEntryRoutes.includes(pathname) &&
    pathname !== "/reset-password"
  ) {
    return redirectWithAuthCookies(request, "/dashboard", authResponse);
  }

  return authResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/policies/:path*",
    "/analysis/:path*",
    "/market/:path*",
    "/recommendations/:path*",
    "/documents/:path*",
    "/consulting/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
