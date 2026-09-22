import { redirect } from "next/navigation";

export default function LegacyPartnerRedirect() {
  redirect("/broker/analytics");
}
