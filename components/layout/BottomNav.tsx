"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconDashboard, IconDocuments, IconPolicies, IconSettings, IconSparkle } from "@/components/icons";
import { consumerNavItems, isConsumerNavActive, type ConsumerNavId } from "@/lib/consumer-nav";
import { cn } from "@/lib/utils";
const icons: Record<ConsumerNavId, typeof IconDashboard> = {
  home: IconDashboard,policies: IconPolicies,documents: IconDocuments,
  atlas: IconSparkle,profile: IconSettings,
};
export function BottomNav() {
  const pathname=usePathname();
  return (
    <nav aria-label="Navigazione principale" className="atlas-bottom-dock fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] px-1 pt-2 backdrop-blur-xl lg:hidden"
      style={{paddingBottom:"max(.55rem, env(safe-area-inset-bottom))"}}>
      <ul className="mx-auto grid max-w-[560px] grid-cols-5 gap-0.5">
        {consumerNavItems.map(item=>{
          const Icon=icons[item.id];const active=isConsumerNavActive(pathname,item.href);const center=item.id==="documents";
          return (
            <li key={item.id}>
              <Link href={item.href} aria-current={active?"page":undefined}
                className={cn("atlas-mobile-tab flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[16px] text-[10px] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  center?"text-accent":active?"bg-accent-soft text-accent":"text-muted-foreground hover:text-foreground")}>
                <span className={cn("flex h-7 w-9 items-center justify-center rounded-[11px]",center?"bg-accent text-white":active?"text-accent":"")}>
                  <Icon className="h-[19px] w-[19px]" aria-hidden />
                </span>
                <span>{item.mobileLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
