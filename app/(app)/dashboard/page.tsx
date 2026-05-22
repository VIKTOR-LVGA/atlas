import Link from "next/link";
import {
  PageHeader,
  PrimaryButton,
} from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CTABox } from "@/components/ui/CTABox";
import { LinkAction } from "@/components/ui/LinkAction";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import {
  IconChevronRight,
  IconClock,
  IconDocuments,
  IconFolder,
  IconSparkle,
  IconUpload,
} from "@/components/icons";
import { getDashboardStats, getRecentDocuments } from "@/lib/dashboard";
import { getProfileShortName } from "@/lib/profile-display";
import { getCurrentProfile } from "@/lib/profiles";
import {
  getPolicyDetailSummary,
  getPolicyTypeLabel,
} from "@/lib/policy-types";
import {
  formatCHF,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatRelativeTime,
} from "@/lib/utils";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Dashboard" };

const pendingAnalysisItems = [
  {
    title: "Insurance health score",
    description: "Richiede estrazione strutturata dalle polizze caricate.",
    status: "Analysis pending",
  },
  {
    title: "AI recommendations",
    description: "Le raccomandazioni arriveranno dopo la fase di analisi.",
    status: "Coming soon",
  },
  {
    title: "Duplicate coverage detection",
    description: "Atlas confrontera le coperture quando il motore sara attivo.",
    status: "Awaiting analysis",
  },
] as const;

function getActivityTimestamp(status: string, createdAt: string, updatedAt: string) {
  return status === "uploaded" ? createdAt : updatedAt;
}

function getActivityCopy(status: string) {
  switch (status) {
    case "analyzed":
      return "Analisi completata";
    case "processing":
      return "Analisi in corso";
    case "failed":
      return "Analisi fallita";
    default:
      return "PDF pronto per analisi";
  }
}

function getPremiumFrequencyLabel(frequency: string) {
  switch (frequency) {
    case "quarterly":
      return "trimestrale";
    case "semiannual":
      return "semestrale";
    case "annual":
      return "annuale";
    default:
      return "mensile";
  }
}

export default async function DashboardPage() {
  const [profile, documentStats, recentDocuments, policies] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(),
    getRecentDocuments(5),
    getCurrentUserPolicies(),
  ]);
  const latestDocument = documentStats.latestDocument;
  const pendingReviewPolicies = policies.filter((policy) => policy.requiresReview);
  const hasCompletedAnalysis = documentStats.analyzedDocuments > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Ciao ${getProfileShortName(profile)}!`}
        description="Il tuo archivio documenti e aggiornato. L'analisi assicurativa arrivera dopo l'elaborazione."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              variant={hasCompletedAnalysis ? "completed" : "processing"}
              label={
                hasCompletedAnalysis
                  ? "Analisi completata"
                  : "Analisi simulata pronta"
              }
            />
            <PrimaryButton href="/documents" icon={<span className="text-lg leading-none">+</span>}>
              Carica nuova polizza
            </PrimaryButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Documenti caricati"
          value={String(documentStats.totalDocuments)}
          subtext={
            documentStats.totalDocuments > 0
              ? "PDF nel tuo archivio"
              : "Carica la prima polizza"
          }
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Upload questo mese"
          value={String(documentStats.documentsUploadedThisMonth)}
          subtext="Basato sui tuoi upload"
          variant="green"
          icon={<IconUpload className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Ultimo documento"
          value={latestDocument ? formatRelativeTime(latestDocument.createdAt) : "Nessun upload"}
          subtext={latestDocument?.fileName ?? "Attivita in attesa"}
          variant="yellow"
          icon={<IconClock className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Storage usato"
          value={formatFileSize(documentStats.totalStorageUsed)}
          subtext={`${documentStats.totalDocuments} file registrati`}
          variant="indigo"
          icon={<IconFolder className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Upload recenti"
            description="Documenti reali nel tuo archivio privato."
            action={<LinkAction href="/documents">Apri documenti</LinkAction>}
            padding="none"
          >
            {recentDocuments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-50 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-2.5">Documento</th>
                      <th className="px-3 py-2.5">Dimensione</th>
                      <th className="px-3 py-2.5">Caricato</th>
                      <th className="px-3 py-2.5">Stato</th>
                      <th className="w-8 px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments.map((document) => (
                      <tr
                        key={document.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/documents/${document.id}`}
                            className="flex min-w-[190px] items-center gap-2.5"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <IconDocuments className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-900">
                                {document.fileName}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {document.mimeType ?? "application/pdf"}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {formatFileSize(document.fileSize)}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          <time
                            dateTime={document.createdAt}
                            title={formatDateTime(document.createdAt)}
                          >
                            {formatRelativeTime(document.createdAt)}
                          </time>
                        </td>
                        <td className="px-3 py-3">
                          <DocumentStatusBadge status={document.status} />
                        </td>
                        <td className="px-3 py-3">
                          <IconChevronRight className="h-4 w-4 text-slate-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <IconUpload className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[14px] font-semibold text-slate-900">
                  Nessun PDF caricato
                </p>
                <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">
                  Carica la tua prima polizza per alimentare statistiche, cronologia e analisi future.
                </p>
                <PrimaryButton href="/documents" className="mt-4">
                  Vai ai documenti
                </PrimaryButton>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Attivita analisi"
          description="Feed generato dai tuoi PDF e dalle bozze assistite."
          padding="sm"
        >
          {recentDocuments.length > 0 ? (
            <ul className="divide-y divide-slate-50">
              {recentDocuments.map((document) => (
                <li key={document.id}>
                  <Link
                    href={`/documents/${document.id}`}
                    className="flex gap-3 py-3 first:pt-0 hover:text-blue-700"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <IconUpload className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-slate-900">
                        {document.fileName}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {getActivityCopy(document.status)}{" "}
                        {formatRelativeTime(
                          getActivityTimestamp(
                            document.status,
                            document.createdAt,
                            document.updatedAt
                          )
                        )}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        {formatDateTime(
                          getActivityTimestamp(
                            document.status,
                            document.createdAt,
                            document.updatedAt
                          )
                        )}{" "}
                        / {formatFileSize(document.fileSize)}
                      </span>
                    </span>
                    <DocumentStatusBadge status={document.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-[220px] flex-col justify-center text-center">
              <p className="text-[13px] font-medium text-slate-900">
                Attivita in attesa
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Upload e analisi simulate compariranno qui con nome, stato e orario.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Le tue polizze"
            description={
              policies.length > 0
                ? "Schede manuali e bozze assistite collegate ai tuoi documenti."
                : "L'archivio polizze si popolera dopo l'analisi dei PDF caricati."
            }
            action={
              policies.length > 0 ? (
                <LinkAction href="/policies">Apri polizze</LinkAction>
              ) : (
                <StatusBadge variant="processing" label="Awaiting analysis" />
              )
            }
          >
            {policies.length > 0 ? (
              <div className="min-h-[286px] space-y-3">
                {pendingReviewPolicies.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge variant="attention" label="Revisione richiesta" />
                        <span className="text-[12px] font-semibold text-slate-900">
                          {pendingReviewPolicies.length} bozze da verificare
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-slate-600">
                        L&apos;analisi mock ha precompilato polizze da confermare.
                      </p>
                    </div>
                    <Link
                      href={`/policies/${pendingReviewPolicies[0].id}`}
                      className="rounded-lg bg-white px-3.5 py-2 text-[12px] font-medium text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100 hover:bg-indigo-50"
                    >
                      Rivedi bozza
                    </Link>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {policies.slice(0, 4).map((policy) => {
                    const policyTypeLabel = getPolicyTypeLabel(
                      policy.policyType,
                      policy.policyCategoryLabel
                    );
                    const detailSummary = getPolicyDetailSummary(
                      policy.policyType,
                      policy.details
                    );

                    return (
                      <Link
                        key={policy.id}
                        href={`/policies/${policy.id}`}
                        className="flex flex-col rounded-xl border border-slate-100 bg-white p-4 transition hover:border-blue-100 hover:bg-blue-50/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-slate-900">
                              {policy.provider}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                              {policyTypeLabel}
                            </span>
                          </span>
                          <StatusBadge
                            variant={policy.requiresReview ? "attention" : "active"}
                            label={policy.requiresReview ? "Da rivedere" : "Attiva"}
                          />
                        </div>
                        {detailSummary && (
                          <span className="mt-3 block truncate rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                            {detailSummary}
                          </span>
                        )}
                        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-50 pt-3 text-[11px]">
                          <span>
                            <span className="block uppercase tracking-wide text-slate-400">
                              Premio
                            </span>
                            <span className="mt-1 block font-medium text-slate-800">
                              {policy.premiumAmount === null
                                ? "Da completare"
                                : `${formatCHF(policy.premiumAmount)} / ${getPremiumFrequencyLabel(policy.premiumFrequency)}`}
                            </span>
                          </span>
                          <span>
                            <span className="block uppercase tracking-wide text-slate-400">
                              Rinnovo
                            </span>
                            <span className="mt-1 block font-medium text-slate-800">
                              {policy.renewalDate
                                ? formatDate(policy.renewalDate)
                                : "Da completare"}
                            </span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[286px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <IconDocuments className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-slate-900">
                  Nessuna polizza analizzata
                </p>
                <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">
                  Carica una polizza PDF per iniziare.
                </p>
                <PrimaryButton href="/documents" className="mt-4">
                  Vai ai documenti
                </PrimaryButton>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Alert intelligence"
          description="Criticita assicurative disponibili dopo l'analisi."
          action={<StatusBadge variant="neutral" label="Analisi in attesa" />}
          padding="sm"
        >
          <div className="flex min-h-[286px] flex-col justify-center rounded-xl border border-slate-100 bg-slate-50/40 p-4">
            <span className="w-fit">
              <StatusBadge variant="processing" label="AI processing unavailable" />
            </span>
            <p className="mt-4 text-[13px] font-semibold text-slate-900">
              Analisi in attesa
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              Gli alert reali appariranno quando Atlas potra leggere le coperture dai tuoi PDF.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Confronto mercato"
            description="Benchmark bloccato finche non esistono polizze analizzate."
            action={<StatusBadge variant="processing" label="Analisi in attesa" />}
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-slate-900">
                  Analisi in attesa
                </p>
                <StatusBadge variant="neutral" label="Awaiting analysis" />
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Il confronto di mercato sara calcolato solo su premi e coperture estratti dalle tue polizze.
              </p>
              <div className="mt-4 space-y-3 opacity-60">
                <div>
                  <div className="mb-1 text-[11px] text-slate-400">Premi analizzati</div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100" />
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-slate-400">Benchmark disponibile</div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="AI assicurativa"
          description="Moduli visibili, elaborazione non ancora attiva."
          action={<StatusBadge variant="neutral" label="Coming soon" />}
          padding="sm"
        >
          <div className="space-y-2.5">
            {pendingAnalysisItems.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <IconSparkle className="h-4 w-4" />
                  </span>
                  <StatusBadge variant="processing" label={item.status} />
                </div>
                <p className="mt-3 text-[12px] font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CTABox
            variant="banner"
            title="Atlas e indipendente: non vendiamo polizze ne riceviamo commissioni da assicuratori."
            buttonLabel=""
          />
        </div>

        <CTABox
          title="Consulenza in preparazione"
          description="La consulenza si colleghera a documenti e analisi reali quando il flusso sara disponibile."
          buttonLabel="Apri consulenza"
          buttonHref="/consulting"
        />
      </div>
    </div>
  );
}
