import { redirect } from "next/navigation";
import { assertBrokerPortalEnabled } from "@/lib/broker-portal";

/** Legacy partner marketing entry → Broker Workspace public page. */
export default function PartnerLandingRedirect() {
  assertBrokerPortalEnabled();
  redirect("/broker");
}
