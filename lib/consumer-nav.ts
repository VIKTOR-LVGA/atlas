export type ConsumerNavId = "home" | "policies" | "documents" | "atlas" | "activity" | "profile";

export const consumerNavItems: Array<{id: ConsumerNavId; href: string; mobileLabel: string}> = [
  { id: "home", href: "/dashboard", mobileLabel: "Home" },
  { id: "policies", href: "/policies", mobileLabel: "Polizze" },
  { id: "documents", href: "/documents", mobileLabel: "Documenti" },
  { id: "atlas", href: "/ask", mobileLabel: "INSURA AI" },
  { id: "profile", href: "/settings", mobileLabel: "Profilo" },
];

export function isConsumerNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
