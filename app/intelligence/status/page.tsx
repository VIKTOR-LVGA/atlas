import { redirect } from "next/navigation";

/** Legacy status URL → canonical apply status. */
export default function IntelligenceStatusRedirect() {
  redirect("/intelligence/apply/status");
}
