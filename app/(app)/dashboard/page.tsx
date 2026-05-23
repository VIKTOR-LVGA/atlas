import Link from "next/link";
import { ClipboardCheck, Sparkles } from "lucide-react";
import {
  PageHeader,
  PrimaryButton,
} from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { LinkAction } from "@/components/ui/LinkAction";
import { PageShell } from "@/components/ui/PageShell";
import { InsightCard } from "@/components/ui/InsightCard";
import { PolicyListCard } from "@/components/policies/PolicyListCard";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import {
  IconChevronRight,
  IconClock,
  IconDocuments,
  IconFolder,
  IconPolicies,
  IconUpload,
} from "@/components/icons";
import { getDashboardStats, getRecentDocuments } from "@/lib/dashboard";
import { getProfileShortName } from "@/lib/profile-display";
import { getCurrentProfile } from "@/lib/profiles";
import {
  formatFileSize,
  formatRelativeTime,
} from "@/lib/utils";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Dashboard" };

function getActivityCopy(status: string) {
  switch (status) {
    case "analyzed":
      return "Analisi completata";
    case "processing":
      return "Analisi in corso";
    case "failed":
      return "Analisi fallita";
    default:
      return "Pronto per analisi";
  }
}

export default async function DashboardPage() {
  const [profile, documentStats, recentDocuments, policies] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(),
    getRecentDocuments(5),
    getCurrentUserPolicies(),
  ]);
  const pendingReviewPolicies = policies.filter((policy) => policy.requiresReview);
  const nextAction =
    pendingReviewPolicies.length > 0
      ? {
          label: "Rivedi bozza AI",
          href: `/policies/${pendingReviewPolicies[0].id}`,
          description: `${pendingReviewPolicies.length} polizza${pendingReviewPolicies.length === 1 ? "" : "e"} in attesa di conferma.`,
        }
      : documentStats.totalDocuments === 0
        ? {
            label: "Carica la prima polizza",
            href: "/documents",
            description: "Inizia caricando un PDF assicurativo svizzero.",
          }
        : recentDocuments.some((doc) => doc.status === "uploaded")
          ? {
              label: "Analizza un documento",
              href: `/documents/${recentDocuments.find((doc) => doc.status === "uploaded")?.id}`,
              description: "Hai PDF pronti per l'estrazione AI.",
            }
          : {
              label: "Esplora le polizze",
              href: "/policies",
              description: "Consulta le schede strutturate nel tuo archivio.",
            };

  return (
    <PageShell>
      <PageHeader
        title={`Ciao ${getProfileShortName(profile)}`}
        description="Panoramica del tuo archivio assicurativo e delle prossime azioni."
        action={
          <PrimaryButton href="/documents" icon={<IconUpload className="h-4 w-4" />}>
            Carica PDF
          </PrimaryButton>
        }
      />

      {nextAction ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
              Prossima azione
            </p>
            <p className="mt-1 text-[14px] font-semibold text-slate-900">
              {nextAction.label}
            </p>
            <p className="mt-0.5 text-[12px] text-slate-600">{nextAction.description}</p>
          </div>
          <Link
            href={nextAction.href}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-blue-700"
          >
            Continua
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Documenti"
          value={String(documentStats.totalDocuments)}
          subtext={`${documentStats.analyzedDocuments} analizzati`}
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Polizze"
          value={String(policies.length)}
          subtext={`${pendingReviewPolicies.length} da rivedere`}
          variant="indigo"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Upload mese"
          value={String(documentStats.documentsUploadedThisMonth)}
          subtext="Questo mese"
          variant="green"
          icon={<IconUpload className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Storage"
          value={formatFileSize(documentStats.totalStorageUsed)}
          subtext="Archivio privato"
          variant="yellow"
          icon={<IconFolder className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title="Upload recenti"
            description="I tuoi PDF nell'archivio privato."
            action={<LinkAction href="/documents">Tutti i documenti</LinkAction>}
            padding="none"
          >
            {recentDocuments.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentDocuments.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/80 sm:px-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <IconDocuments className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-slate-900">
                        {document.fileName}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {getActivityCopy(document.status)} ·{" "}
                        {formatRelativeTime(document.createdAt)}
                      </span>
                    </span>
                    <DocumentStatusBadge status={document.status} />
                    <IconChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-[13px] font-medium text-slate-900">
                  Nessun documento caricato
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Carica un PDF per avviare l&apos;estrazione.
                </p>
                <PrimaryButton href="/documents" className="mt-4">
                  Vai ai documenti
                </PrimaryButton>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Polizze recenti"
            description="Schede create dall'analisi AI o manualmente."
            action={
              policies.length > 0 ? (
                <LinkAction href="/policies">Archivio completo</LinkAction>
              ) : undefined
            }
            padding="none"
          >
            {policies.length > 0 ? (
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {policies.slice(0, 4).map((policy) => (
                  <PolicyListCard key={policy.id} policy={policy} />
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-[13px] font-medium text-slate-900">
                  Nessuna polizza strutturata
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Analizza un PDF per generare la prima bozza.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          {pendingReviewPolicies.length > 0 ? (
            <SectionCard title="Revisione" padding="sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    {pendingReviewPolicies.length} bozze AI
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                    Conferma i dati estratti prima di usarli come riferimento.
                  </p>
                  <Link
                    href={`/policies/${pendingReviewPolicies[0].id}/edit`}
                    className="mt-3 inline-flex text-[12px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    Inizia revisione
                  </Link>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Moduli Atlas" padding="sm">
            <div className="space-y-3">
              <InsightCard
                icon={<Sparkles className="h-4 w-4" />}
                title="Analisi coperture"
                description="Score, duplicati e gap saranno disponibili con più polizze verificate."
                statusLabel={policies.length > 0 ? "In sviluppo" : "Serve polizza"}
                statusVariant={policies.length > 0 ? "processing" : "neutral"}
                href="/analysis"
                hrefLabel="Apri analisi"
              />
              <InsightCard
                icon={<IconClock className="h-4 w-4" />}
                title="Confronto mercato"
                description="Benchmark su premi reali estratti dai tuoi documenti."
                statusLabel="In arrivo"
                statusVariant="neutral"
                href="/market"
                hrefLabel="Vedi modulo"
              />
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] leading-relaxed text-slate-600">
            Atlas e indipendente: non vendiamo polizze ne riceviamo commissioni da
            assicuratori.
          </div>
        </div>
      </div>
    </PageShell>
  );
}
