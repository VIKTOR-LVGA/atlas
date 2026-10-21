import Link from "next/link";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";

const links = [
  {href:"/info/come-funziona",label:"Come funziona"},
  {href:"/info/sicurezza",label:"Sicurezza"},
  {href:"/info/trasparenza",label:"Trasparenza"},
  {href:"/info/faq",label:"FAQ"},
  {href:"/login",label:"Accedi"},
];

export function LandingFooter() {
  return <footer className="border-t border-[#e5eaf3] bg-[#f5f7fc]">
    <div className="mx-auto max-w-[1200px] px-5 py-9 sm:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div><Link href="/" className="inline-flex" aria-label="INSURA homepage"><AtlasBrandLogo variant="stacked"/></Link><p className="mt-2 text-[12px] text-[#56647b]">Le tue assicurazioni, finalmente chiare.</p></div>
        <nav aria-label="Collegamenti footer" className="flex flex-wrap gap-x-5 gap-y-3">{links.map(({href,label})=><Link key={href} href={href} className="text-[12px] font-semibold text-[#40516c] hover:text-[#3157eb]">{label}</Link>)}</nav>
      </div>
      <div className="mt-7 flex flex-col gap-2 border-t border-[#e0e6f0] pt-5 text-[11px] text-[#647189] sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} INSURA · Svizzera</span><span>Versione pilota · Documentazione legale in revisione</span></div>
    </div>
  </footer>;
}
