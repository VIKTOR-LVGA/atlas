"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChartNoAxesColumnIncreasing, FileText, HelpCircle, Home, ShieldCheck, Scale, Sparkles, Plus } from "lucide-react";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import { getProfileDisplayName, getProfileInitials } from "@/lib/profile-display";
import { cn } from "@/lib/utils";

const entries=[
  {href:"/dashboard",label:"Home",Icon:Home},
  {href:"/policies",label:"Le mie polizze",Icon:ShieldCheck},
  {href:"/documents",label:"Documenti",Icon:FileText},
  {href:"/analysis",label:"Premi e costi",Icon:ChartNoAxesColumnIncreasing},
  {href:"/ask",label:"Chiedi a INSURA",Icon:Sparkles},
  {href:"/market",label:"Confronto mercato",Icon:Scale},
  {href:"/recommendations",label:"Raccomandazioni",Icon:Sparkles},
  {href:"/consulting",label:"Consulenza",Icon:HelpCircle},
];

export function Sidebar(){
  const pathname=usePathname();
  const profile=useCurrentProfile();
  return <aside className="atlas-sidebar-panel hidden h-screen w-[240px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border lg:flex">
    <Link href="/dashboard" className="flex h-[80px] shrink-0 items-center px-6" aria-label="INSURA, vai alla home"><AtlasBrandLogo variant="stacked" compact/></Link>
    <div className="flex-1 px-3 pt-3">
      <nav aria-label="Navigazione principale" className="space-y-1.5">
        {entries.map(({href,label,Icon})=>{
          const active=pathname===href||pathname.startsWith(href+"/")||(href==="/dashboard"&&pathname==="/");
          return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn(
            "atlas-sidebar-link flex min-h-[49px] items-center gap-3.5 rounded-[14px] px-4 text-[13px] font-semibold",
            active?"bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]":"text-muted-foreground hover:bg-card-muted hover:text-foreground"
          )}><Icon className={cn("h-5 w-5 shrink-0",active?"text-accent":"text-muted")} aria-hidden/>{label}</Link>;
        })}
      </nav>
      <Link href="/documents" className="atlas-btn-primary mt-6 flex min-h-11 w-full items-center justify-center gap-2 text-[12px]">
        <Plus className="h-4 w-4" aria-hidden/> Aggiungi polizza
      </Link>
      <Link href="/consulting" className="atlas-ref-sidebar-promo mt-6 block overflow-hidden rounded-[20px] border border-[#d9e5ff]">
        <div className="px-4 pt-5"><p className="text-[18px] font-extrabold leading-[1.18] tracking-[-.04em] text-[#122b62]">Protezione<br/>per ogni tuo<br/>domani.</p></div>
        <div className="flex h-[125px] items-end justify-between bg-[url('/brand/atlas-alpine-lake-hero.webp')] bg-cover bg-[72%_center] px-4 pb-3"><span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#26447a]">Apri Consulenza</span><ArrowUpRight className="h-4 w-4 text-[#2147a1]"/></div>
      </Link>
    </div>
    <Link href="/settings" className="mx-3 mb-4 mt-5 flex items-center gap-3 rounded-[15px] border border-border bg-card px-3 py-3 hover:bg-card-muted">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-accent-soft text-[12px] font-bold text-accent">{getProfileInitials(profile)}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-bold text-foreground">{getProfileDisplayName(profile)}</span><span className="block text-[11px] text-muted">Il mio profilo</span></span>
      <ArrowUpRight className="h-4 w-4 text-muted" aria-hidden/>
    </Link>
  </aside>;
}
