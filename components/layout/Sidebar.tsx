"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
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
    <aside className="atlas-sidebar-panel hidden h-screen w-[240px] shrink-0 flex-col border-r border-sidebar-border lg:flex">
      <Link href="/dashboard" className="flex h-[80px] items-center px-6" aria-label="ATLAS, vai alla home">
        <AtlasBrandLogo variant="stacked" compact />
      </Link>
      <div className="flex-1 px-4">
        <p className="atlas-premium-eyebrow mb-4 px-3">Navigazione</p>
        <nav aria-label="Navigazione principale" className="space-y-1.5">
          {consumerNavItems.map(item=>{
            const Icon=icons[item.id];
            const active=isConsumerNavActive(pathname,item.href);
            return (
              <Link key={item.id} href={item.href} aria-current={active?"page":undefined}
                className={cn("atlas-sidebar-link flex min-h-[50px] items-center gap-3.5 rounded-[15px] px-4 text-[13px] font-semibold",
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
        <Link href="/atlas/ask" className="atlas-ref-sidebar-promo mt-8 block overflow-hidden rounded-[20px] border border-[#d9e5ff]">
          <div className="px-4 pt-5">
            <p className="text-[18px] font-extrabold leading-[1.18] tracking-[-.04em] text-[#122b62]">Protezione<br/>per ogni tuo<br/>domani.</p>
          </div>
          <div className="flex h-[130px] items-end justify-between bg-[url('/brand/atlas-trust-switzerland.png')] bg-cover bg-center px-4 pb-3">
            <span className="rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold text-[#26447a] backdrop-blur-sm">Chiedi ad ATLAS</span>
            <ArrowUpRight className="h-4 w-4 text-[#2147a1]"/>
          </div>
        </Link>
      </div>
      <Link href="/settings" className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 hover:bg-card-muted">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-accent-soft text-[12px] font-bold text-accent">{getProfileInitials(profile)}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-foreground">{getProfileDisplayName(profile)}</span><span className="block truncate text-[11px] text-muted">Il mio profilo</span></span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted"/>
      </Link>
    </aside>
  );
}
