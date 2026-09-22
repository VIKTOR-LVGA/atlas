import {
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  requireIntelligenceAccess,
} from "@/lib/intelligence-access";
import { ATLAS_INTELLIGENCE_METHODOLOGY_VERSION } from "@/lib/intelligence/privacy";

export const metadata = { title: "Metodologia | ATLAS Intelligence" };

export default async function IntelligenceMethodologyPage() {
  await requireIntelligenceAccess();

  return (
    <>
      <header className="mb-6 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Metodologia</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Come ATLAS Intelligence costruisce aggregati privacy-safe sul campione osservato.
        </p>
        <IntelligenceMethodNote>
          Versione {ATLAS_INTELLIGENCE_METHODOLOGY_VERSION}. {INTELLIGENCE_REPRESENTATIVENESS_NOTE}
        </IntelligenceMethodNote>
      </header>

      <div className="space-y-6 text-[13px] leading-relaxed text-muted">
        <section className="rounded-xl border border-border bg-card/70 p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Campione ATLAS</h2>
          <p className="mt-2">
            Tutte le metriche descrivono utenti e pratiche osservate su ATLAS. Non rappresentano
            necessariamente l&apos;intero mercato assicurativo svizzero. Preferiamo wording come
            «quota osservata nel campione ATLAS».
          </p>
        </section>
        <section className="rounded-xl border border-border bg-card/70 p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Soglia privacy</h2>
          <p className="mt-2">
            Coorte minima configurabile: k≥{INTELLIGENCE_MIN_COHORT}. Ogni filtro deve soddisfare
            la soglia dopo l&apos;applicazione. Sotto soglia: stato «insufficient_sample» senza
            valori metrici nascosti.
          </p>
        </section>
        <section className="rounded-xl border border-border bg-card/70 p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Eligibilità</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Premi: categoria nota, compagnia nota, premio annualizzato CHF &gt; 0</li>
            <li>Switch: compagnia origine ≠ destinazione, fonte confermata</li>
            <li>Coperture: penetrazione su status noto (included/excluded); unknown escluso dal denominatore</li>
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card/70 p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Distribuzioni premio</h2>
          <p className="mt-2">
            Reportiamo mediana, P25 e P75. Non esponiamo min/max. Non usiamo la media aritmetica
            come metrica primaria.
          </p>
        </section>
        <section className="rounded-xl border border-border bg-card/70 p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Limitazioni</h2>
          <p className="mt-2">
            Bias di selezione, copertura regionale incompleta, piccole coorti. Correlation ≠
            causation. Differenza mediana osservata post-switch non implica «ATLAS fa risparmiare
            CHF X».
          </p>
        </section>
      </div>
    </>
  );
}
