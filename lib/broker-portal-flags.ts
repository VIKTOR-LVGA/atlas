import { isFeatureEnabled } from "@/lib/feature-flags";

/**
 * Broker Workspace + legacy Partner apply/portal path helpers.
 * Safe for Edge (proxy) and Node. Default OFF via feature flag.
 */
export function isBrokerPortalEnabled() {
  return isFeatureEnabled("broker_portal");
}

/** Paths that belong exclusively to the hibernated Broker product surface. */
export function isBrokerPortalPath(pathname: string): boolean {
  if (pathname === "/broker" || pathname.startsWith("/broker/")) return true;
  if (pathname === "/partner" || pathname.startsWith("/partner/")) return true;
  return false;
}
