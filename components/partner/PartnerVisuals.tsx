import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileSignature,
  LayoutDashboard,
  LineChart,
  ScrollText,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Premium partner category visuals — sober, Swiss fintech. */
export const partnerAreaVisuals = {
  dashboard: {
    label: "Dashboard",
    icon: LayoutDashboard,
    accent: "from-accent/25 via-transparent to-transparent",
  },
  leads: {
    label: "Richieste",
    icon: BriefcaseBusiness,
    accent: "from-sky-500/20 via-transparent to-transparent",
  },
  clients: {
    label: "Clienti",
    icon: Users,
    accent: "from-violet-500/20 via-transparent to-transparent",
  },
  appointments: {
    label: "Appuntamenti",
    icon: CalendarDays,
    accent: "from-emerald-500/20 via-transparent to-transparent",
  },
  offers: {
    label: "Offerte",
    icon: ScrollText,
    accent: "from-amber-500/20 via-transparent to-transparent",
  },
  contracts: {
    label: "Contratti",
    icon: FileSignature,
    accent: "from-teal-500/20 via-transparent to-transparent",
  },
  commissions: {
    label: "Commissioni",
    icon: Wallet,
    accent: "from-lime-500/20 via-transparent to-transparent",
  },
  analytics: {
    label: "Analytics",
    icon: LineChart,
    accent: "from-indigo-500/20 via-transparent to-transparent",
  },
  profile: {
    label: "Profilo",
    icon: UserRound,
    accent: "from-accent/20 via-transparent to-transparent",
  },
} as const;

export type PartnerAreaKey = keyof typeof partnerAreaVisuals;

export function PartnerAreaIcon({
  area,
  className,
  size = "md",
}: {
  area: PartnerAreaKey;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const visual = partnerAreaVisuals[area];
  const Icon = visual.icon;
  const box =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-accent shadow-sm",
        box,
        className
      )}
    >
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90",
          visual.accent
        )}
      />
      <Icon className={cn("relative", iconSize)} strokeWidth={1.75} />
    </span>
  );
}

export function PartnerHeroArtwork({
  area,
  className,
}: {
  area: PartnerAreaKey;
  className?: string;
}) {
  const visual = partnerAreaVisuals[area];
  const Icon = visual.icon as LucideIcon;
  return (
    <div
      aria-hidden
      className={cn(
        "relative hidden h-24 w-28 overflow-hidden rounded-2xl border border-border sm:block",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent",
          visual.accent
        )}
      />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:10px_10px]" />
      <Icon
        className="absolute bottom-3 right-3 h-10 w-10 text-accent"
        strokeWidth={1.25}
      />
    </div>
  );
}
