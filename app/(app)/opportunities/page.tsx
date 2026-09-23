import { permanentRedirect } from "next/navigation";

/**
 * Opportunities became the "Da fare" tab of Attività — one place for everything
 * that needs the user's attention.
 */
export default function OpportunitiesPage() {
  permanentRedirect("/activity?tab=actions");
}
