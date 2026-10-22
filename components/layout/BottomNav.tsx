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
  return <nav aria-label="Navigazione principale" className="atlas-bottom-dock fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-[#e5eaf3] bg-white/95 px-1 pt-1 shadow-[0_-8px_30px_rgba(18,26,41,0.05)] backdrop-blur-xl lg:hidden"
    style={{paddingBottom:"max(.5rem,env(safe-area-inset-bottom))"}}>
    <ul className="mx-auto grid max-w-[560px] grid-cols-5 gap-0.5">
      {consumerNavItems.map(item=>{
        const Icon=icons[item.id],active=isConsumerNavActive(pathname,item.href),add=item.id==="documents";
        return <li key={item.id}>
          <Link href={add?"/documents":item.href} aria-current={active?"page":undefined}
            aria-label={add?"Apri documenti per caricare una polizza":item.mobileLabel}
            className={cn("atlas-mobile-tab flex min-h-[65px] flex-col items-center justify-center gap-1 rounded-[15px] text-[10px] font-semibold focus-visible:outline-2 focus-visible:outline-accent",
              active&&!add?"text-accent":"text-muted-foreground")}>
            {add?<span className="grid h-12 w-12 -translate-y-2 place-items-center rounded-full bg-[#1766f7] text-white shadow-[0_6px_18px_rgba(54,90,222,.26)]"><Plus className="h-[23px] w-[23px]" aria-hidden/></span>:
              <Icon className={cn("h-5 w-5",active?"text-accent":"text-muted")} aria-hidden/>}
            <span className={cn(add?"-mt-2 text-[#1766f7]":"")}>{add?"Carica PDF":item.mobileLabel}</span>
          </Link>
        </li>;
      })}
    </ul>
  </nav>;
}
