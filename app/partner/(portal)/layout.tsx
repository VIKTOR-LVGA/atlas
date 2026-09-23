import { redirect } from "next/navigation";
import { assertBrokerPortalEnabled } from "@/lib/broker-portal";

/** Legacy Partner Portal shell — traffic redirected to Broker Workspace. */
export default function LegacyPartnerPortalLayout() {
  assertBrokerPortalEnabled();
  redirect("/broker/dashboard");
}
