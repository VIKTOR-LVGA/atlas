"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { IconAnalysis, IconDashboard, IconDocuments, IconPolicies, IconSettings, IconSparkle } from "@/components/icons";
import { consumerNavItems, isConsumerNavActive, type ConsumerNavId } from "@/lib/consumer-nav";
import { cn } from "@/lib/utils";
const icons: Record<ConsumerNavId, typeof IconDashboard> = {
  home:IconDashboard,policies:IconPolicies,documents:IconDocuments,
  atlas:IconSparkle,activity:IconAnalysis,profile:IconSettings,
};
export function BottomNav(){
  const pathname=usePathname();
  return <nav aria-label="Navigazione principale" className="atlas-bottom-dock fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] px-1 pt-1 backdrop-blur-xl lg:hidden"
    style={{paddingBottom:"max(.5rem,env(safe-area-inset-bottom))"}}>
    <ul className="mx-auto grid max-w-[560px] grid-cols-5 gap-0.5">
      {consumerNavItems.map(item=>{
        const Icon=icons[item.id],active=isConsumerNavActive(pathname,item.href),add=item.id==="documents";
        return <li key={item.id}>
          <Link href={item.href} aria-current={active?"page":undefined}
            aria-label={add?"Aggiungi una polizza o apri i documenti":item.mobileLabel}
            className={cn("atlas-mobile-tab flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-[15px] text-[10px] font-semibold focus-visible:outline-2 focus-visible:outline-accent",
              active&&!add?"text-accent":"text-muted-foreground")}>
            {add?<span className="grid h-10 w-10 -translate-y-1 place-items-center rounded-full bg-[#3a5bf3] text-white shadow-[0_6px_18px_rgba(54,90,222,.26)]"><Plus className="h-[23px] w-[23px]" aria-hidden/></span>:
              <Icon className={cn("h-5 w-5",active?"text-accent":"text-muted")} aria-hidden/>}
            <span className={cn(add?"-mt-1 text-[#3b5df3]":"")}>{add?"Aggiungi":item.mobileLabel}</span>
          </Link>
        </li>;
      })}
    </ul>
  </nav>;
}
