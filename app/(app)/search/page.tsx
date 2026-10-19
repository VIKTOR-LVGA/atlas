import Link from "next/link";
import { ArrowRight, FileText, Search, ShieldCheck } from "lucide-react";
import { getCurrentUserPolicies } from "@/lib/policies";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getVisualCategoryForPolicy } from "@/lib/policy-visual-categories";

export const metadata = { title: "Cerca in ATLAS" };

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const raw=(await searchParams).q??"";
  const term=raw.slice(0,80).trim().toLocaleLowerCase("it-CH");
  const [policies,documents]=await Promise.all([getCurrentUserPolicies(),getCurrentUserDocuments()]);
  const matches=term?policies.filter(policy=>[policy.provider,policy.policyCategoryLabel??"",policy.policyType,policy.policyNumber??""].some(value=>value.toLocaleLowerCase("it-CH").includes(term))):[];
  const files=term?documents.filter(doc=>[doc.fileName,doc.recognizedInsurer??""].some(value=>value.toLocaleLowerCase("it-CH").includes(term))):[];
  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="atlas-consumer-hero p-6 sm:p-8">
      <p className="atlas-premium-eyebrow">Il tuo archivio personale</p>
      <h1 className="atlas-premium-title mt-2">Cerca in ATLAS</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">Trova polizze e PDF del tuo account per compagnia, categoria o nome del file.</p>
      <form action="/search" method="GET" role="search" className="mt-6 flex min-h-12 items-center gap-3 rounded-[17px] border border-border bg-card px-4">
        <Search className="h-5 w-5 text-accent" aria-hidden/>
        <input type="search" name="q" defaultValue={raw} maxLength={80} placeholder="Cerca polizze, documenti..." aria-label="Cosa vuoi cercare?" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"/>
        <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-[12px] font-bold text-white">Cerca</button>
      </form>
    </header>
    {!term?<p className="text-[13px] text-muted">Scrivi un nome o un termine per iniziare.</p>:(
      <>
        <section className="atlas-consumer-card p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-bold"><ShieldCheck className="h-5 w-5 text-accent"/> Polizze ({matches.length})</h2>
          {matches.length?<ul className="divide-y divide-border-subtle">{matches.map(p=><li key={p.id}><Link className="flex min-h-14 items-center justify-between gap-3 py-3 text-[13px] hover:text-accent" href={`/policies/${p.id}`}><span className="min-w-0"><strong className="block truncate">{getVisualCategoryForPolicy(p).label}</strong><span className="block truncate text-[11px] text-muted">{p.provider||"Compagnia da verificare"}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-accent"/></Link></li>)}</ul>:<p className="text-[13px] text-muted">Nessuna polizza trovata.</p>}
        </section>
        <section className="atlas-consumer-card p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-bold"><FileText className="h-5 w-5 text-accent"/> Documenti ({files.length})</h2>
          {files.length?<ul className="divide-y divide-border-subtle">{files.map(d=><li key={d.id}><Link className="flex min-h-14 items-center justify-between gap-3 py-3 text-[13px] hover:text-accent" href={`/documents/${d.id}`}><span className="min-w-0"><strong className="block truncate">{d.fileName}</strong><span className="block text-[11px] text-muted">{d.recognizedInsurer??"PDF privato"}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-accent"/></Link></li>)}</ul>:<p className="text-[13px] text-muted">Nessun documento trovato.</p>}
        </section>
      </>
    )}
  </div>;
}
