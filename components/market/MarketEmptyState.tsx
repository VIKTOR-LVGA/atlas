import Link from "next/link";
import { BarChart3, FileText, Shield, Sparkles, Upload } from "lucide-react";
import type { MarketIntelligence } from "@/lib/market-intelligence";
import { SectionCard } from "@/components/ui/SectionCard";
import { PrimaryButton } from "@/components/ui/PageHeader";

type MarketEmptyStateProps = {
  intelligence: MarketIntelligence;
};

export function MarketEmptyState({ intelligence }: MarketEmptyStateProps) {
  const { readiness } = intelligence;

  return (
    <div className="space-y-4">
      <div className="atlas-card-primary overflow-hidden">
        <div className="border-b border-border-subtle bg-gradient-to-r from-accent-soft/50 via-card to-card px-5 py-6 sm:px-6">
          <BarChart3 className="h-8 w-8 text-accent" />
          <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-foreground">
            Prepara il portafoglio per l&apos;intelligence di mercato
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
            Atlas sta costruendo la base dati per futuri confronti svizzeri. Carica e
            verifica le polizze — i benchmark saranno disponibili con il modulo mercato.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton href="/documents" icon={<Upload className="h-4 w-4" />}>
              Carica PDF
            </PrimaryButton>
            <Link
              href="/policies"
              className="atlas-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px]"
            >
              Vedi polizze
            </Link>
          </div>
        </div>
        <ol className="grid gap-px bg-border-subtle sm:grid-cols-3">
          {[
            {
              icon: <Upload className="h-4 w-4" />,
              title: "Documenti verificati",
              text: "PDF analizzati e collegati alle schede.",
            },
            {
              icon: <Sparkles className="h-4 w-4" />,
              title: "Bozze confermate",
              text: "Premi, persone e coperture approvati.",
            },
            {
              icon: <Shield className="h-4 w-4" />,
              title: "Confronti futuri",
              text: "Moduli benchmark quando i dati CH saranno disponibili.",
            },
          ].map((step) => (
            <li key={step.title} className="bg-card px-4 py-3.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                {step.icon}
              </span>
              <p className="mt-2 text-[12px] font-semibold text-foreground">
                {step.title}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {readiness.blockers.length > 0 ? (
        <SectionCard title="Prossimi passi" padding="sm">
          <ul className="space-y-2">
            {readiness.blockers.slice(0, 4).map((blocker) => (
              <li key={blocker.id}>
                <Link
                  href={blocker.ctaHref}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2.5 transition hover:bg-card-muted"
                >
                  <span className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground">
                      {blocker.title}
                    </p>
                    <p className="text-[10px] text-muted">{blocker.progressDetail}</p>
                  </span>
                  <FileText className="h-4 w-4 shrink-0 text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}
