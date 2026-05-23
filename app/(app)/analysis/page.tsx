import Link from "next/link";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { PlaceholderModule } from "@/components/ui/PlaceholderModule";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import {
  IconAlert,
  IconAnalysis,
  IconCheck,
  IconDocuments,
  IconPlus,
  IconShield,
} from "@/components/icons";
import { getDashboardStats, getRecentDocuments } from "@/lib/dashboard";
import { getCurrentUserPolicies } from "@/lib/policies";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Analisi" };

export default async function AnalysisPage() {
  const [documentStats, recentDocuments, policies] = await Promise.all([
    getDashboardStats(),
    getRecentDocuments(4),
    getCurrentUserPolicies(),
  ]);
  const verifiedPolicies = policies.filter((policy) => !policy.requiresReview);

  const workflowSteps = [
    {
      label: "Upload documenti",
      status: documentStats.totalDocuments > 0 ? "Completato" : "In attesa",
      variant: documentStats.totalDocuments > 0 ? ("ok" as const) : ("neutral" as const),
    },
    {
      label: "Estrazione AI",
      status:
        documentStats.analyzedDocuments > 0 ? "Attivo" : "In attesa",
      variant:
        documentStats.analyzedDocuments > 0 ? ("ok" as const) : ("processing" as const),
    },
    {
      label: "Revisione bozze",
      status:
        policies.filter((p) => p.requiresReview).length > 0
          ? `${policies.filter((p) => p.requiresReview).length} da rivedere`
          : policies.length > 0
            ? "Completata"
            : "In attesa",
      variant:
        policies.filter((p) => p.requiresReview).length > 0
          ? ("attention" as const)
          : policies.length > 0
            ? ("ok" as const)
            : ("neutral" as const),
    },
    {
      label: "Score e alert",
      status: "In arrivo",
      variant: "neutral" as const,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Analisi"
        description="Intelligence assicurativa su coperture, rischi e opportunita — in espansione."
        action={
          <PrimaryButton href="/documents" icon={<IconPlus className="h-4 w-4" />}>
            Carica PDF
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Documenti"
          value={String(documentStats.totalDocuments)}
          subtext={`${documentStats.analyzedDocuments} analizzati`}
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Polizze estratte"
          value={String(policies.length)}
          subtext={`${verifiedPolicies.length} verificate`}
          variant="green"
          icon={<IconShield className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Health score"
          value="—"
          subtext="Modulo in arrivo"
          variant="indigo"
          icon={<IconAnalysis className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Alert"
          value="—"
          subtext="Dopo piu polizze"
          variant="yellow"
          icon={<IconAlert className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Analisi coperture">
            <PlaceholderModule
              icon={<IconAnalysis className="h-6 w-6" />}
              title={
                policies.length > 0
                  ? "Analisi avanzata in preparazione"
                  : "Carica e analizza una polizza"
              }
              description={
                policies.length > 0
                  ? "Hai gia polizze estratte. Score, duplicati e gap compariranno qui quando il motore di analisi sara attivo."
                  : "Dopo l'estrazione AI da un PDF, Atlas potra confrontare coperture e segnalare criticita."
              }
              statusLabel={policies.length > 0 ? "Polizze disponibili" : "Serve PDF"}
              actionLabel="Vai alle polizze"
              actionHref="/policies"
            />
          </SectionCard>
        </div>

        <SectionCard title="Percorso" padding="sm">
          <ol className="space-y-2">
            {workflowSteps.map((step, index) => (
              <li
                key={step.label}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-slate-900">{step.label}</p>
                  <StatusBadge
                    variant={step.variant}
                    label={step.status}
                    className="mt-1"
                  />
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <SectionCard
        title="Documenti nel flusso"
        action={
          <Link href="/documents" className="text-[12px] font-medium text-blue-600">
            Tutti
          </Link>
        }
        padding="sm"
      >
        {recentDocuments.length > 0 ? (
          <ul className="divide-y divide-slate-50">
            {recentDocuments.map((document) => (
              <li key={document.id}>
                <Link
                  href={`/documents/${document.id}`}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-900">
                      {document.fileName}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {formatFileSize(document.fileSize)} ·{" "}
                      {formatRelativeTime(document.createdAt)}
                    </span>
                  </span>
                  <DocumentStatusBadge status={document.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-slate-500">Nessun documento caricato.</p>
        )}
      </SectionCard>

      <SectionCard title="Output futuri" padding="sm">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            "Punteggio copertura",
            "Rischi e doppie coperture",
            "Opportunita di risparmio",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl border border-slate-100 p-3"
            >
              <IconCheck className="h-4 w-4 text-slate-300" />
              <span className="text-[12px] text-slate-600">{item}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
