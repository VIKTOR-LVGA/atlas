export type ConsumerNavId =
  | "home"
  | "policies"
  | "documents"
  | "opportunities"
  | "profile";

export type ConsumerNavItem = {
  id: ConsumerNavId;
  href: string;
  mobileLabel: string;
  desktopLabel: string;
};

export const consumerNavItems: ConsumerNavItem[] = [
  {
    id: "home",
    href: "/dashboard",
    mobileLabel: "Home",
    desktopLabel: "Dashboard",
  },
  {
    id: "policies",
    href: "/policies",
    mobileLabel: "Polizze",
    desktopLabel: "Le mie polizze",
  },
  {
    id: "documents",
    href: "/documents",
    mobileLabel: "Documenti",
    desktopLabel: "Documenti",
  },
  {
    id: "opportunities",
    href: "/opportunities",
    mobileLabel: "Opportunità",
    desktopLabel: "Opportunità",
  },
  {
    id: "profile",
    href: "/settings",
    mobileLabel: "Profilo",
    desktopLabel: "Profilo",
  },
];

export function isConsumerNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
