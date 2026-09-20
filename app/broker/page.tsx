import { redirect } from "next/navigation";

export default function BrokerRootRedirect() {
  redirect("/partner/dashboard");
}
