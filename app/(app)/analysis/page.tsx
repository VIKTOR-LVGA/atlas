import Link from "next/link";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
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
import { formatDateTime, formatFileSize, formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Analisi" };

export default async function AnalysisPage() {
  const [documentStats, recentDocuments] = await Promise.all([
    getDashboardStats(),
    getRecentDocuments(4),
  ]);
  const hasDocuments = documentStats.totalDocuments > 0;

  const workflowSteps = [
    {
      label: "Upload documenti",
      status: hasDocuments ? "Pronto" : "In attesa",
      variant: hasDocuments ? "ok" : "neutral",
    },
    { label: "OCR e estrazione", status: "Non disponibile", variant: "neutral" },
    { label: "Analisi coperture", status: "Analisi in attesa", variant: "processing" },
    { label: "Benchmark mercato", status: "In attesa", variant: "neutral" },
    { label: "Raccomandazioni", status: "In attesa", variant: "neutral" },
  ] as const;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analisi"
        description="Analisi non ancora disponibile: Atlas conserva i PDF reali, ma non estrae ancora le polizze."
        action={
          <PrimaryButton href="/documents" icon={<IconPlus className="h-4 w-4" />}>
            Carica una polizza PDF
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Documenti caricati"
          value={String(documentStats.totalDocuments)}
          subtext="Archivio reale"
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Polizze analizzate"
          value="In attesa"
          subtext="Estrazione non attiva"
          variant="green"
          icon={<IconShield className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Health score"
          value="Non disponibile"
          subtext="Analisi documenti richiesta"
          variant="indigo"
          icon={<IconAnalysis className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Alert reali"
          value="In attesa"
          subtext="Nessun alert simulato"
          variant="yellow"
          icon={<IconAlert className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Analisi assicurativa"
            action={<StatusBadge variant="processing" label="Analisi in attesa" />}
          >
            <div className="flex min-h-[330px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <IconAnalysis className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-slate-900">
                Analisi non ancora disponibile
              </h2>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-slate-500">
                Carica una polizza PDF per iniziare. Score, rischi, coperture e opportunita
                verranno mostrati solo quando l&apos;analisi documentale sara pronta.
              </p>
              <PrimaryButton href="/documents" className="mt-5">
                Apri documenti
              </PrimaryButton>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Workflow" padding="sm">
          <ol className="space-y-2.5">
            {workflowSteps.map((step, index) => (
              <li key={step.label} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-start gap-3">
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
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Documenti pronti per analisi"
            description="Upload reali disponibili in Supabase."
            action={<Link href="/documents" className="text-[12px] font-medium text-blue-600">Tutti</Link>}
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
                          {formatFileSize(document.fileSize)} / caricato{" "}
                          {formatRelativeTime(document.createdAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className="hidden text-[10px] text-slate-400 sm:inline"
                          title={formatDateTime(document.createdAt)}
                        >
                          {formatDateTime(document.createdAt)}
                        </span>
                        <DocumentStatusBadge status={document.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-[12px] text-slate-500">
                Carica una polizza PDF per iniziare.
              </p>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Output in attesa" padding="sm">
          <div className="space-y-2.5">
            {[
              "Punteggio copertura",
              "Rischi e doppie coperture",
              "Opportunita di miglioramento",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <IconCheck className="h-3 w-3" />
                </span>
                <span className="text-[12px] text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
