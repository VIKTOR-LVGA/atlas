import Link from "next/link";
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
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
          ATLAS
        </h1>
        <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Il posto dove capire le tue assicurazioni, senza dover rileggere i PDF.
        </p>
      </header>

      <div className="grid gap-2 md:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="atlas-consumer-card atlas-consumer-press flex flex-col px-4 py-5"
          >
            <p className="atlas-section-eyebrow">{tool.eyebrow}</p>
            <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-foreground">
              {tool.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{tool.body}</p>
            <span className="mt-4 text-[13px] font-medium text-accent">Apri</span>
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
