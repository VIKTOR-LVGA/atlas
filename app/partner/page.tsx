import { redirect } from "next/navigation";

/** Legacy partner marketing entry → Broker Workspace public page. */
export default function PartnerLandingRedirect() {
  redirect("/broker");
}
