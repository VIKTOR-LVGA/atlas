export type ConsumerNavId =
  | "home"
  | "policies"
  | "atlas"
  | "activity"
  | "profile";

export type ConsumerNavItem = {
  id: ConsumerNavId;
  href: string;
  mobileLabel: string;
  desktopLabel: string;
};

/** Five primary tabs. Documents remain a first-class route, linked from Home/ATLAS. */
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
    id: "atlas",
    href: "/atlas",
    mobileLabel: "ATLAS",
    desktopLabel: "ATLAS",
  },
  {
    id: "activity",
    href: "/activity",
    mobileLabel: "Attività",
    desktopLabel: "Attività",
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
