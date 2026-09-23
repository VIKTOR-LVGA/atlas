import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthRedirect, isProductRoute } from "@/lib/auth-redirect";
import {
  isBrokerPortalEnabled,
  isBrokerPortalPath,
} from "@/lib/broker-portal-flags";
import { getSupabaseConfig } from "@/lib/supabase/config";

function redirectWithAuthCookies(
  request: NextRequest,
  path: string,
  authResponse: NextResponse,
  search = ""
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = search;

  const redirectResponse = NextResponse.redirect(url);
  authResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let authResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
    },
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

  // Hibernate Broker Workspace + legacy Partner portal (code retained).
  if (!isBrokerPortalEnabled() && isBrokerPortalPath(pathname)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (!user && isProductRoute(pathname)) {
    const nextPath = `${pathname}${request.nextUrl.search}`;
    const search = `?next=${encodeURIComponent(nextPath)}`;
    return redirectWithAuthCookies(request, "/login", authResponse, search);
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
    const requestedNext =
      pathname === "/login"
        ? request.nextUrl.searchParams.get("next")
        : null;
    const intent =
      pathname === "/login"
        ? request.nextUrl.searchParams.get("intent")
        : null;
    const destination =
      requestedNext
        ? getSafeAuthRedirect(requestedNext, {
            brokerPortalEnabled: isBrokerPortalEnabled(),
          })
        : intent === "intelligence"
          ? "/intelligence/apply/status"
          : getSafeAuthRedirect(null);
    const destUrl = new URL(destination, request.nextUrl.origin);

    return redirectWithAuthCookies(
      request,
      destUrl.pathname,
      authResponse,
      destUrl.search
    );
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
    "/opportunities/:path*",
    "/settings/:path*",
    "/broker",
    "/broker/:path*",
    "/intelligence",
    "/intelligence/:path*",
    "/admin",
    "/admin/:path*",
    "/partner/apply",
    "/partner/status",
    "/partner/dashboard",
    "/partner/dashboard/:path*",
    "/partner/leads",
    "/partner/leads/:path*",
    "/partner/clients",
    "/partner/clients/:path*",
    "/partner/appointments",
    "/partner/appointments/:path*",
    "/partner/offers",
    "/partner/offers/:path*",
    "/partner/contracts",
    "/partner/contracts/:path*",
    "/partner/commissions",
    "/partner/commissions/:path*",
    "/partner/analytics",
    "/partner/analytics/:path*",
    "/partner/profile",
    "/partner/profile/:path*",
    "/control-center",
    "/control-center/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
