"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CircleHelp, Plus } from "lucide-react";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import { IconAnalysis, IconDashboard, IconDocuments, IconPolicies, IconSettings, IconSparkle } from "@/components/icons";
import { getProfileDisplayName, getProfileInitials } from "@/lib/profile-display";
import { consumerNavItems, isConsumerNavActive, type ConsumerNavId } from "@/lib/consumer-nav";
import { cn } from "@/lib/utils";

const icons: Record<ConsumerNavId, typeof IconDashboard> = {
  home: IconDashboard, policies: IconPolicies, documents: IconDocuments,
  atlas: IconSparkle, activity: IconAnalysis, profile: IconSettings,
};

export function Sidebar() {
  const pathname = usePathname();
  const profile = useCurrentProfile();
  return (
    <aside className="atlas-sidebar-panel hidden h-screen w-[264px] shrink-0 flex-col border-r border-sidebar-border lg:flex">
      <Link href="/dashboard" className="flex h-[86px] items-center px-7" aria-label="ATLAS, vai alla home">
        <AtlasBrandLogo variant="stacked" compact />
      </Link>
      <div className="flex-1 px-4">
        <p className="atlas-premium-eyebrow mb-4 px-3">Il tuo spazio</p>
        <nav aria-label="Navigazione principale" className="space-y-1.5">
          {consumerNavItems.map(item=>{
            const Icon=icons[item.id];
            const active=isConsumerNavActive(pathname,item.href);
            return (
              <Link key={item.id} href={item.href} aria-current={active?"page":undefined}
                className={cn("atlas-sidebar-link flex min-h-[51px] items-center gap-3.5 rounded-2xl px-4 text-[14px] font-semibold",
                  active?"bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]":"text-muted-foreground hover:bg-card-muted hover:text-foreground")}>
                <Icon className={cn("h-[19px] w-[19px] shrink-0",active?"text-accent":"text-muted")}/>
                {item.desktopLabel}
              </Link>
            );
          })}
        </nav>
        <Link href="/documents" className="atlas-btn-primary mt-7 flex w-full items-center justify-center gap-2 px-3 py-3 text-[13px]">
          <Plus className="h-4 w-4" aria-hidden/> Aggiungi polizza
        </Link>
        <div className="mt-8 rounded-[22px] border border-border bg-card-muted px-4 py-4">
          <CircleHelp className="h-5 w-5 text-accent"/>
          <p className="mt-3 text-[13px] font-semibold text-foreground">Un dubbio sulla polizza?</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">Fai una domanda ad ATLAS, con riferimenti ai tuoi dati.</p>
          <Link href="/atlas/ask" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-accent">Chiedi ad ATLAS <ArrowUpRight className="h-3.5 w-3.5"/></Link>
        </div>
      </div>
      <Link href="/settings" className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 hover:bg-card-muted">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-accent-soft text-[12px] font-bold text-accent">{getProfileInitials(profile)}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-foreground">{getProfileDisplayName(profile)}</span><span className="block truncate text-[11px] text-muted">Il mio profilo</span></span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted"/>
      </Link>
    </aside>
  );
}
