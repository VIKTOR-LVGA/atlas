import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { LandingSection, LandingSectionHeader } from "@/components/landing/LandingSection";
import { AtlasPolicyArtwork } from "@/components/visual/AtlasPolicyArtwork";
import type { VisualPolicyCategoryId } from "@/lib/policy-visual-categories";

const categories: Array<{id:VisualPolicyCategoryId;title:string;caption:string}> = [
  {id:"household",title:"Casa",caption:"Documenti per abitazione e mobilia"},
  {id:"car",title:"Auto",caption:"Polizze per auto e mobilità"},
  {id:"health",title:"Salute",caption:"Cassa malati e complementari"},
  {id:"travel",title:"Altre coperture",caption:"Viaggi, vita e molto altro"},
];

/** Category illustrations are examples, not ATLAS-issued insurance products. */
export function LandingProductShowcase() {
  return (
    <LandingSection id="product" tone="base" className="py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <LandingSectionHeader
          eyebrow="Tutto, in un unico posto"
          title="Un posto per ogni assicurazione."
          description="Dall'auto alla casa, fino alla salute. ATLAS ti aiuta a organizzare i documenti che hai già, senza perderti tra PDF e condizioni."
        />
        <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map(category=>(
            <Link key={category.id} href="/register" aria-label={`Inizia a organizzare le polizze: ${category.title}`} className="atlas-v2-feature-tile flex min-w-0 flex-col overflow-hidden p-4 sm:p-5">
              <div className="flex min-h-[122px] items-center justify-center rounded-[18px] bg-[var(--card-muted)]">
                <div className="scale-[1.13] sm:scale-[1.33]"><AtlasPolicyArtwork category={category.id}/></div>
              </div>
              <h3 className="mt-5 text-[17px] font-bold tracking-[-.04em] text-foreground sm:text-[19px]">{category.title}</h3>
              <p className="mt-1.5 min-h-[40px] text-[11px] leading-snug text-muted-foreground sm:text-[12px]">{category.caption}</p>
              <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-accent">
                <ShieldCheck className="h-4 w-4" aria-hidden /> Organizza le tue polizze <ArrowUpRight className="h-3.5 w-3.5" aria-hidden/>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">Illustrazioni delle categorie. ATLAS non emette polizze assicurative: aiuta a comprendere e organizzare quelle esistenti.</p>
      </div>
    </LandingSection>
  );
}
