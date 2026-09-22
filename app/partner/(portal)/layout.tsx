import { redirect } from "next/navigation";

/** Legacy Partner Portal shell — traffic redirected to Broker Workspace. */
export default function LegacyPartnerPortalLayout() {
  redirect("/broker/dashboard");
}
