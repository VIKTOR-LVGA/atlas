export type ConsumerNavId =
  | "home"
  | "policies"
  | "documents"
  | "atlas"
  | "activity"
  | "profile";

export type ConsumerNavItem = {
  id: ConsumerNavId;
  href: string;
  mobileLabel: string;
  desktopLabel: string;
};

/** Five simple primary tabs across desktop and mobile. */
export const consumerNavItems: ConsumerNavItem[] = [
  {
    id: "home",
    href: "/dashboard",
    mobileLabel: "Home",
    desktopLabel: "Home",
  },
  {
    id: "policies",
    href: "/policies",
    mobileLabel: "Polizze",
    desktopLabel: "Polizze",
  },
  {
    id: "documents",
    href: "/documents",
    mobileLabel: "Documenti",
    desktopLabel: "Documenti",
  },
  {
    id: "atlas",
    href: "/atlas",
    mobileLabel: "ATLAS",
    desktopLabel: "ATLAS",
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
  if (href === "/atlas") {
    return pathname === "/atlas" || pathname.startsWith("/atlas/");
  }
  if (href === "/activity") {
    return (
      pathname === "/activity" ||
      pathname.startsWith("/activity/") ||
      pathname.startsWith("/claims") ||
      pathname === "/opportunities" ||
      pathname.startsWith("/opportunities/")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
