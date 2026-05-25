import Link from "next/link";
import { FileText, Sparkles, Upload, UserCheck } from "lucide-react";
import type { ConsultingIntelligence } from "@/lib/consulting-intelligence";
import { PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

type ConsultingEmptyStateProps = {
  intelligence: ConsultingIntelligence;
};

export function ConsultingEmptyState({ intelligence }: ConsultingEmptyStateProps) {
  const { readiness, checklist } = intelligence;

  return (
    <div className="space-y-4">
      <div className="atlas-card-primary overflow-hidden">
        <div className="border-b border-border-subtle bg-gradient-to-r from-accent-soft/45 via-card to-card px-5 py-6 sm:px-6">
          <UserCheck className="h-8 w-8 text-accent" />
          <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-foreground">
            Costruisci il dossier per una futura revisione umana
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
            Atlas organizza i tuoi PDF e le polizze strutturate. Quando il servizio
            consulenza sarà disponibile, un revisore potrà lavorare su dati già verificati
            — senza appuntamenti o prezzi simulati oggi.
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
              title: "1. Carica",
              text: "Archivia polizze PDF nel workspace privato.",
            },
            {
              icon: <Sparkles className="h-4 w-4" />,
              title: "2. Analizza e conferma",
              text: "Estrazione AI e verifica bozze.",
            },
            {
              icon: <UserCheck className="h-4 w-4" />,
              title: "3. Revisione futura",
              text: "Dossier pronto per esperto indipendente.",
            },
          ].map((step) => (
            <li key={step.title} className="bg-card px-4 py-3.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                {step.icon}
              </span>
              <p className="mt-2 text-[12px] font-semibold text-foreground">{step.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {checklist.length > 0 ? (
        <SectionCard title="Primi passi" padding="sm">
          <ul className="space-y-2">
            {checklist.slice(0, 4).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.ctaHref}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2.5 transition hover:bg-card-muted"
                >
                  <span className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted">{item.progressDetail}</p>
                  </span>
                  <FileText className="h-4 w-4 shrink-0 text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {readiness.blockers.length > 0 ? (
        <p className="text-center text-[11px] text-muted">
          Readiness {readiness.percent}% · {readiness.labelText}
        </p>
      ) : null}
    </div>
  );
}
