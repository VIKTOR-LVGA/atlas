import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { DashboardAlertList } from "@/components/dashboard/DashboardAlertList";
import { DashboardHealthScoreCard } from "@/components/dashboard/DashboardHealthScoreCard";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { formatKpiValue } from "@/lib/motion";
import { DashboardWorkflowSteps } from "@/components/dashboard/DashboardWorkflowSteps";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import {
  IconChevronRight,
  IconClock,
  IconDocuments,
  IconFolder,
  IconPolicies,
  IconUpload,
} from "@/components/icons";
import { PolicyListCard } from "@/components/policies/PolicyListCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { LinkAction } from "@/components/ui/LinkAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  atlasAsideColumn,
  atlasCard,
  atlasKpiRow,
  atlasMainAside,
  atlasMainColumn,
  atlasSpace,
} from "@/lib/atlas-ui";
import { getDashboardIntelligence } from "@/lib/dashboard-intelligence";
import { getDashboardStats, getRecentDocuments } from "@/lib/dashboard";
import { getProfileShortName } from "@/lib/profile-display";
import { getCurrentProfile } from "@/lib/profiles";
import { getCurrentUserPolicies } from "@/lib/policies";
import { formatCHF, formatFileSize, formatRelativeTime } from "@/lib/utils";

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
  const [
    profile,
    documentStats,
    recentDocuments,
    policies,
    intelligence,
  ] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(),
    getRecentDocuments(5),
    getCurrentUserPolicies(),
    getDashboardIntelligence(),
  ]);

  const { kpis, healthScore, alerts, workflowSteps } = intelligence;
  const pendingReviewPolicies = policies.filter((policy) => policy.requiresReview);
  const monthlyPremium = formatKpiValue(kpis.totalMonthlyPremium, formatCHF);
  const annualPremium = formatKpiValue(kpis.totalAnnualPremium, formatCHF);
  const avgConfidence = formatKpiValue(
    kpis.averageExtractionConfidence,
    (value) => `${Math.round(value)}%`
  );

  const nextAction =
    pendingReviewPolicies.length > 0
      ? {
          label: "Rivedi bozza AI",
          href: `/policies/${pendingReviewPolicies[0].id}/edit`,
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
              description: "Consulta le schede strutturate nel tuo portafoglio.",
            };

  const marketReady = intelligence.marketPrerequisiteCount >= 3;
  const highAlerts = alerts.filter((alert) => alert.severity === "high").length;

  return (
    <PageShell>
      <RevealStagger>
      <PageHeader
        title={`Ciao ${getProfileShortName(profile)}`}
        description="Centro di comando Atlas: intelligence assicurativa basata sui tuoi dati reali."
        action={
          <PrimaryButton href="/documents" icon={<IconUpload className="h-4 w-4" />}>
            Carica PDF
          </PrimaryButton>
        }
      />

      <div className="atlas-action-strip flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="atlas-section-eyebrow text-accent">Prossima azione</p>
          <p className="mt-1 text-[13px] font-semibold text-foreground">
            {nextAction.label}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {nextAction.description}
          </p>
        </div>
        <Link
          href={nextAction.href}
          className="atlas-btn-primary shrink-0 px-4 py-2 text-[12px]"
        >
          Continua
        </Link>
      </div>

      <div className={atlasKpiRow}>
        <MetricCard
          label="Polizze"
          value={String(kpis.totalPolicies)}
          subtext={`${kpis.confirmedPolicies} confermate`}
          variant="indigo"
          icon={<IconPolicies className="h-4 w-4" />}
        />
        <MetricCard
          label="Documenti"
          value={String(kpis.totalDocuments)}
          subtext={`${kpis.analyzedDocuments} analizzati`}
          variant="blue"
          icon={<IconDocuments className="h-4 w-4" />}
        />
        <MetricCard
          label="Da rivedere"
          value={String(kpis.policiesRequiringReview)}
          subtext={
            kpis.policiesRequiringReview > 0 ? "Bozze AI in coda" : "Nessuna bozza"
          }
          variant={kpis.policiesRequiringReview > 0 ? "yellow" : "green"}
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <MetricCard
          label="Premio mensile"
          value={monthlyPremium.display}
          subtext={
            annualPremium.unavailable
              ? "Solo polizze confermate"
              : `${annualPremium.display} / anno stimato`
          }
          variant="purple"
          unavailableValue={monthlyPremium.unavailable}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className={`${atlasSpace.contentGrid} lg:grid-cols-3`}>
        <div className="lg:col-span-2">
          <DashboardHealthScoreCard healthScore={healthScore} />
        </div>
        <div className={`${atlasSpace.kpiGrid} sm:grid-cols-2 lg:grid-cols-1`}>
          <MetricCard
            label="Coperture"
            value={String(kpis.coverageCount)}
            subtext={
              kpis.unassignedCoverageCount > 0
                ? `${kpis.insuredPeopleCount} persone · ${kpis.unassignedCoverageCount} da assegnare`
                : `${kpis.insuredPeopleCount} persone · tutte assegnate`
            }
            variant="green"
            icon={<Shield className="h-4 w-4" />}
          />
          <MetricCard
            label="Confidenza media"
            value={avgConfidence.display}
            subtext="Estrazione AI"
            variant="blue"
            unavailableValue={avgConfidence.unavailable}
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>
      </div>

      <section className={atlasSpace.block}>
        <p className="atlas-section-eyebrow">Pipeline documenti</p>
        <div className={`${atlasKpiRow} grid-cols-2`}>
          <MetricCard
            label="Upload mese"
            value={String(documentStats.documentsUploadedThisMonth)}
            subtext="Questo mese"
            variant="green"
            icon={<IconUpload className="h-4 w-4" />}
          />
          <MetricCard
            label="In elaborazione"
            value={String(kpis.processingDocuments)}
            subtext={`${kpis.uploadedDocumentsAwaitingAnalysis} in attesa`}
            variant="yellow"
            icon={<FileText className="h-4 w-4" />}
          />
          <MetricCard
            label="Analizzati"
            value={String(kpis.analyzedDocuments)}
            subtext={`${kpis.failedDocuments} falliti`}
            variant="indigo"
            icon={<IconDocuments className="h-4 w-4" />}
          />
          <MetricCard
            label="Storage"
            value={formatFileSize(documentStats.totalStorageUsed)}
            subtext="Archivio privato"
            variant="purple"
            icon={<IconFolder className="h-4 w-4" />}
          />
        </div>
      </section>

      <div className={atlasMainAside}>
        <div className={atlasMainColumn}>
          <SectionCard
            title="Alert center"
            tone="primary"
            description={
              alerts.length > 0
                ? `${alerts.length} segnalazioni${highAlerts > 0 ? ` · ${highAlerts} prioritarie` : ""}`
                : "Nessuna criticità sui dati attuali."
            }
            padding="sm"
            bodyClassName="px-3.5"
          >
            <DashboardAlertList alerts={alerts} />
          </SectionCard>

          <SectionCard
            title="Polizze da rivedere"
            description="Bozze AI in attesa di conferma."
            action={
              pendingReviewPolicies.length > 0 ? (
                <LinkAction href="/policies">Vedi tutte</LinkAction>
              ) : undefined
            }
            padding="none"
          >
            {pendingReviewPolicies.length > 0 ? (
              <div className={`${atlasSpace.cardGrid} p-4 md:grid-cols-2`}>
                {pendingReviewPolicies.slice(0, 4).map((policy) => (
                  <PolicyListCard key={policy.id} policy={policy} />
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[12px] font-medium text-foreground">
                  Nessuna revisione in sospeso
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Le bozze confermate alimentano score e alert.
                </p>
              </div>
            )}
          </SectionCard>

          <div className={`${atlasSpace.cardGrid} lg:grid-cols-2`}>
            <SectionCard
              title="Documenti recenti"
              description="Ultimi PDF nell'archivio."
              action={<LinkAction href="/documents">Tutti</LinkAction>}
              padding="none"
            >
              {recentDocuments.length > 0 ? (
                <div className="divide-y divide-border-subtle">
                  {recentDocuments.map((document) => (
                    <Link
                      key={document.id}
                      href={`/documents/${document.id}`}
                      className="atlas-row-interactive flex items-center gap-2.5 px-3.5 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--danger-bg)] text-[var(--danger-text)] ring-1 ring-[var(--danger-border)]">
                        <IconDocuments className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-foreground">
                          {document.fileName}
                        </span>
                        <span className="mt-px block text-[10px] text-muted">
                          {getActivityCopy(document.status)} ·{" "}
                          {formatRelativeTime(document.createdAt)}
                        </span>
                      </span>
                      <DocumentStatusBadge status={document.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-[11px] text-muted">
                  Nessun documento caricato.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Polizze recenti"
              description="Schede da estrazione AI o inserimento manuale."
              action={
                policies.length > 0 ? (
                  <LinkAction href="/policies">Archivio</LinkAction>
                ) : undefined
              }
              padding="none"
            >
              {policies.length > 0 ? (
                <div className={`${atlasSpace.tight} p-4`}>
                  {policies.slice(0, 3).map((policy) => (
                    <PolicyListCard key={policy.id} policy={policy} />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-[11px] text-muted">
                  Nessuna polizza strutturata.
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        <aside className={atlasAsideColumn}>
          <SectionCard
            title="Workflow Atlas"
            description="Da documento a intelligence verificata."
            padding="sm"
          >
            <DashboardWorkflowSteps steps={workflowSteps} />
          </SectionCard>

          <SectionCard
            title="Moduli intelligence"
            tone="support"
            padding="sm"
            bodyClassName={atlasSpace.tight}
          >
            <InsightCard
              icon={<Sparkles className="h-3.5 w-3.5" />}
              title="Analisi coperture"
              description={
                kpis.confirmedPolicies > 0
                  ? "Gap e duplicati con più polizze verificate."
                  : "Servono polizze confermate per avviare l'analisi."
              }
              statusLabel={
                kpis.confirmedPolicies > 0 ? "In sviluppo" : "Serve polizza"
              }
              statusVariant={kpis.confirmedPolicies > 0 ? "processing" : "neutral"}
              href="/analysis"
              hrefLabel="Apri analisi"
            />
            <InsightCard
              icon={<IconClock className="h-3.5 w-3.5" />}
              title="Confronto mercato"
              description={
                marketReady
                  ? "Benchmark in preparazione sui premi confermati."
                  : `Benchmark in preparazione (${intelligence.marketPrerequisiteCount}/3 polizze confermate).`
              }
              statusLabel="In preparazione"
              statusVariant="neutral"
              href="/market"
              hrefLabel="Vedi modulo"
            />
            <InsightCard
              icon={<Users className="h-3.5 w-3.5" />}
              title="Raccomandazioni"
              description={
                intelligence.recommendationsAvailable
                  ? "Suggerimenti deterministici dal portafoglio."
                  : "Servono più dati verificati."
              }
              statusLabel={
                intelligence.recommendationsAvailable
                  ? "Disponibile"
                  : "Servono più dati"
              }
              statusVariant="neutral"
              href="/recommendations"
              hrefLabel="Apri modulo"
            />
          </SectionCard>

          {kpis.failedDocuments > 0 ? (
            <SectionCard title="Attenzione documenti" padding="sm">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--danger-bg)] text-[var(--danger-text)] ring-1 ring-[var(--danger-border)]">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-foreground">
                    {kpis.failedDocuments} analisi fallita
                    {kpis.failedDocuments === 1 ? "" : "e"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Controlla i PDF con errore OCR o estrazione.
                  </p>
                  <Link
                    href="/documents"
                    className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-accent"
                  >
                    Vai ai documenti
                    <IconChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <div
            className={`${atlasCard.support} px-4 py-3 text-[11px] leading-relaxed text-muted`}
          >
            Atlas è indipendente: nessun dato demo. Ogni cifra deriva dai tuoi PDF
            e dalle schede confermate.
          </div>
        </aside>
      </div>
      </RevealStagger>
    </PageShell>
  );
}
