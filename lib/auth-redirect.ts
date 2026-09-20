export const productRoutes = [
  "/dashboard",
  "/policies",
  "/analysis",
  "/market",
  "/recommendations",
  "/documents",
  "/consulting",
  "/opportunities",
  "/settings",
  "/broker",
  "/admin",
] as const;

export function isProductRoute(pathname: string) {
  return productRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Only in-app product paths are allowed after login.
 * Rejects protocol-relative, external, and auth entry URLs.
 */
export function getSafeAuthRedirect(next: string | null | undefined): string {
  if (!next) {
    return "/dashboard";
  }

  const trimmed = next.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://")
  ) {
    return "/dashboard";
  }

  try {
    const url = new URL(trimmed, "http://atlas.local");

    if (url.origin !== "http://atlas.local" || url.username || url.password) {
      return "/dashboard";
    }

    if (!isProductRoute(url.pathname)) {
      return "/dashboard";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "/dashboard";
  }
}
