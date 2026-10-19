import Link from "next/link";
import { ArrowRight, BrainCircuit, MessageCircle, ScanSearch, Sparkles } from "lucide-react";
import { after } from "next/server";
import { CoverageMap } from "@/components/insurance-os/CoverageMap";
import { VerificationLegend } from "@/components/insurance-os/VerificationBadge";
import { EmptyState } from "@/components/consumer/EmptyState";
import {
  buildCoverageMap,
  listCurrentUserPolicyCoverages,
} from "@/lib/insurance-os/coverage-map";
import { getLatestCheckup } from "@/lib/insurance-os/checkup";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";
import { trackProductEvent } from "@/lib/insurance-os/telemetry";
import { getCurrentUserPolicies } from "@/lib/policies";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "ATLAS" };

const TOOLS = [
  {
    href: "/atlas/ask",
    eyebrow: "Domande",
    title: "Chiedi ad ATLAS",
    body: "Domande in linguaggio naturale sulla tua situazione. Ogni risposta cita i documenti da cui arriva.",
  },
  {
    href: "/atlas/what-if",
    eyebrow: "Scenari",
    title: "E se succedesse…",
    body: "Descrivi un evento possibile: ATLAS mostra quali polizze entrerebbero in gioco e cosa resta incerto.",
  },
  {
    href: "/atlas/checkup",
    eyebrow: "Revisione",
    title: "Check-up del portafoglio",
    body: "Una lettura completa: cosa è chiaro, cosa è da verificare, cosa manca. Nessuna proposta commerciale.",
  },
];

export default async function AtlasHubPage() {
  const [policies, coverages, checkup] = await Promise.all([
    getCurrentUserPolicies(),
    listCurrentUserPolicyCoverages(),
    isIosFeatureEnabled("annual_checkup") ? getLatestCheckup() : Promise.resolve(null),
  ]);

  const coverageMap = buildCoverageMap({ policies, coverages });
  const showCoverageMap = isIosFeatureEnabled("coverage_intelligence");

  after(async () => {
    await trackProductEvent("coverage_map_opened", {
      route: "/atlas",
      policies: policies.length,
    });
  });

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[28px] bg-[#19305a] p-6 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full bg-[#5276ef]/25 blur-2xl" aria-hidden/>
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Sparkles className="h-6 w-6" aria-hidden/></span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[.17em] text-white/70">Il tuo assistente assicurativo</p>
          <h1 className="mt-2 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-.05em]">Chiedi ad ATLAS.</h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/75">
            Una domanda semplice, una risposta con le informazioni che risultano dai tuoi documenti.
          </p>
          <Link href="/atlas/ask" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-[15px] bg-white px-5 text-[13px] font-bold text-[#19305a] hover:bg-white/90">
            Fai una domanda <ArrowRight className="h-4 w-4" aria-hidden/>
          </Link>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="atlas-consumer-card atlas-consumer-press flex flex-col px-5 py-6"
          >
            <p className="atlas-section-eyebrow">{tool.eyebrow}</p>
            <p className="mt-2 text-[17px] font-bold tracking-[-.025em] text-foreground">
              {tool.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{tool.body}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-bold text-accent">Apri <ArrowRight className="h-4 w-4" aria-hidden/></span>
          </Link>
        ))}
      </div>

      {checkup ? (
        <p className="text-[12px] text-muted">
          Ultimo check-up: {formatDate(checkup.createdAt)} · completezza dati{" "}
          {checkup.dataCompletenessPercent}%.
        </p>
      ) : null}

      {policies.length === 0 ? (
        <EmptyState
          title="La mappa si costruisce dai tuoi documenti."
          description="Carica una polizza: ATLAS la legge e inizia a riempire le aree della tua vita assicurativa."
          actionLabel="Carica un documento"
          actionHref="/documents"
          secondaryLabel="Inserisci una polizza a mano"
          secondaryHref="/policies/new"
        />
      ) : showCoverageMap ? (
        <>
          <CoverageMap
            categories={coverageMap.categories}
            description="Undici aree della vita assicurativa. Tocca un’area per vedere polizze, coperture, esclusioni e le pagine da cui arrivano."
          />
          <div className="atlas-consumer-card px-4 py-4">
            <p className="atlas-section-eyebrow">Come leggere i dati</p>
            <div className="mt-3">
              <VerificationLegend />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              ATLAS non inventa condizioni assenti dai documenti. Quando un dato manca, lo
              dice.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
