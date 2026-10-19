import Link from "next/link";
import { ArrowRight, FilePlus2, ShieldCheck } from "lucide-react";

export function AtlasAlpineHero({
  greeting, name, empty=false,
}: {greeting: string;name: string;empty?: boolean}) {
  return (
    <header className="atlas-v2-swiss-banner relative isolate overflow-hidden rounded-[27px] px-6 py-8 sm:px-9 sm:py-10 lg:min-h-[250px] lg:px-10 lg:py-11">
      <div className="relative z-10 max-w-[560px]">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#556bc3]">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Il tuo spazio ATLAS
        </p>
        <h1 className="mt-4 max-w-[510px] text-[clamp(1.9rem,3.1vw,3.1rem)] font-bold leading-[1.12] tracking-[-.05em] text-[#172544]">{greeting}, {name}</h1>
        <p className="mt-3 max-w-[410px] text-[13px] leading-relaxed text-[#56698b] sm:text-[15px]">
          {empty
            ? "Le tue assicurazioni, finalmente più chiare. Comincia caricando la prima polizza."
            : "Le tue polizze e i tuoi documenti, tutti insieme. Scopri cosa sai già e cosa resta da controllare."}
        </p>
        <Link href={empty?"/documents":"/policies"} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[#1e376b] px-5 text-[13px] font-bold text-white shadow-[0_12px_25px_rgba(18,40,88,.16)] transition-colors hover:bg-[#2d4a86]">
          {empty?<FilePlus2 className="h-4 w-4" aria-hidden/>:null}
          {empty?"Carica la prima polizza":"Visualizza le polizze"} <ArrowRight className="h-4 w-4" aria-hidden/>
        </Link>
      </div>
      <span className="pointer-events-none absolute bottom-4 right-5 hidden rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-[10px] font-semibold text-[#5b6b8d] shadow-sm backdrop-blur sm:inline-flex">
        Il tuo percorso, più semplice.
      </span>
    </header>
  );
}
