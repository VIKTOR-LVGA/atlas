import "server-only";

import { notFound } from "next/navigation";
import {
  isBrokerPortalEnabled,
  isBrokerPortalPath,
} from "@/lib/broker-portal-flags";

export { isBrokerPortalEnabled, isBrokerPortalPath };

/**
 * Call from Broker/Partner pages, layouts, and server actions.
 * Returns Next.js 404 when the portal is hibernated.
 */
export function assertBrokerPortalEnabled(): void {
  if (!isBrokerPortalEnabled()) notFound();
}
