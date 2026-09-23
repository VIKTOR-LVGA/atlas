export const productRoutes = [
  "/dashboard",
  "/policies",
  "/analysis",
  "/market",
  "/recommendations",
  "/documents",
  "/consulting",
  "/opportunities",
  "/atlas",
  "/activity",
  "/claims",
  "/settings",
  "/broker/dashboard",
  "/broker/requests",
  "/broker/clients",
  "/broker/appointments",
  "/broker/offers",
  "/broker/contracts",
  "/broker/commissions",
  "/broker/analytics",
  "/broker/profile",
  "/intelligence/dashboard",
  "/intelligence/market",
  "/intelligence/switching",
  "/intelligence/premiums",
  "/intelligence/coverages",
  "/intelligence/geography",
  "/intelligence/insurers",
  "/intelligence/reports",
  "/intelligence/profile",
  "/intelligence/methodology",
  "/admin",
  "/partner/apply",
  "/partner/status",
  "/partner/dashboard",
  "/partner/leads",
  "/partner/clients",
  "/partner/appointments",
  "/partner/offers",
  "/partner/contracts",
  "/partner/commissions",
  "/partner/analytics",
  "/partner/profile",
  "/control-center",
] as const;

/** Public marketing / application surfaces — not gated by auth. */
const publicExactRoutes = new Set([
  "/broker",
  "/intelligence",
  "/partner",
]);

const publicPrefixes = [
  "/intelligence/apply",
  "/intelligence/status",
];

export function isPublicIntelligencePath(pathname: string) {
  return publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isBrokerishPath(pathname: string) {
  return (
    pathname === "/broker" ||
    pathname.startsWith("/broker/") ||
    pathname === "/partner" ||
    pathname.startsWith("/partner/")
  );
}

export function isProductRoute(pathname: string) {
  if (publicExactRoutes.has(pathname)) return false;
  if (isPublicIntelligencePath(pathname)) return false;
  return productRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Only in-app product paths are allowed after login.
 * Rejects protocol-relative, external, and auth entry URLs.
 * When Broker portal is hibernated, broker/partner next targets fall back to dashboard.
 */
export function getSafeAuthRedirect(
  next: string | null | undefined,
  options?: { brokerPortalEnabled?: boolean }
): string {
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

    // Default false matches feature-flag hibernation (ENABLE_BROKER_PORTAL off).
    const brokerEnabled = options?.brokerPortalEnabled ?? false;
    if (!brokerEnabled && isBrokerishPath(url.pathname)) {
      return "/dashboard";
    }

    // Allow returning to public Intelligence apply after login
    if (isPublicIntelligencePath(url.pathname) || url.pathname === "/intelligence") {
      return `${url.pathname}${url.search}`;
    }

    if (!isProductRoute(url.pathname)) {
      return "/dashboard";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "/dashboard";
  }
}
