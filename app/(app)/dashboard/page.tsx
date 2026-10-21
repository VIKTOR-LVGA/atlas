import Link from "next/link";
import { CalendarDays, Wallet } from "lucide-react";
import { ClipboardCheck, Sparkles } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PageHeader";

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
  const confirmed = policies.filter((p) => !p.requiresReview);
  const frequencyFactor = {monthly:12,quarterly:4,semiannual:2,annual:1} as const;
  const priced = confirmed.filter((p) => p.currency === "CHF" && p.premiumAmount !== null && Number.isFinite(p.premiumAmount) && p.premiumAmount >= 0);
  const annualTotal = priced.reduce((sum,p) => sum + (p.premiumAmount ?? 0) * frequencyFactor[p.premiumFrequency],0);
  const nextRenewal = confirmed.filter((p) => p.renewalDate && p.renewalDate >= new Date().toISOString().slice(0,10)).sort((a,b)=>(a.renewalDate ?? "").localeCompare(b.renewalDate ?? ""))[0];
  const money = (n:number) => new Intl.NumberFormat("de-CH",{style:"currency",currency:"CHF",maximumFractionDigits:2}).format(n);
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
      <header className="space-y-1 pb-2"><p className="text-[12px] font-bold uppercase tracking-[.12em] text-[#7c8ba5]">Il tuo spazio assicurativo</p><h1 className="text-[32px] font-extrabold tracking-tight text-[#101e3c]">Ciao {getProfileShortName(profile)} 👋</h1><p className="text-[13px] text-[#74829c]">Le tue assicurazioni, più semplici.</p></header>

      {nextAction ? (
        <div className="flex flex-col gap-3 rounded-[22px] border border-[#dce6ff] bg-[#eef2ff] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-accent">
              Prossima azione
            </p>
            <p className="mt-1 text-[14px] font-semibold text-foreground">
              {nextAction.label}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">{nextAction.description}</p>
          </div>
          <Link
            href={nextAction.href}
            className="atlas-btn-primary shrink-0 py-2.5 text-[13px]"
          >
            Continua
          </Link>
        </div>
      ) : null}

      <Link href="/ask" className="flex items-center justify-between gap-3 rounded-[20px] border border-[#dce6ff] bg-white p-5"><span><strong className="block text-[15px] text-[#101e3c]">Chiedi a INSURA ✨</strong><span className="mt-1 block text-[12px] text-[#687a99]">Simula situazioni e verifica le tue coperture, anche nelle CGA.</span></span><span className="text-[#3157eb]">→</span></Link>\n      <Link href="/analysis" className="block overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1045d2] via-[#1766f7] to-[#268dff] p-6 text-white shadow-[0_15px_35px_rgba(23,100,241,.2)] sm:p-8"><p className="text-[12px] font-bold uppercase tracking-wider text-white/80">Spesa annuale confermata</p><p className="mt-5 text-[38px] font-extrabold tracking-tight">{priced.length ? money(annualTotal) : "—"}</p><p className="mt-1 text-[13px] text-white/85">{priced.length ? money(annualTotal/12)+" / mese equivalente" : "Conferma un premio per vedere il totale"}</p><p className="mt-6 text-[11px] text-white/75">Solo premi CHF confermati · Apri analisi →</p></Link>
      <div className="flex items-center justify-between"><h2 className="text-[19px] font-extrabold text-[#101e3c]">Le tue polizze</h2><Link href="/policies" className="text-[12px] font-bold text-[#1766f7]">Vedi tutte →</Link></div>
      {policies.length ? <div className="grid gap-3 md:grid-cols-2">{policies.slice(0,4).map(policy=><PolicyListCard key={policy.id} policy={policy}/>)}</div> : <div className="rounded-[22px] border border-[#e5eaf3] bg-white p-8 text-center"><p className="font-bold text-[#101e3c]">Il tuo archivio inizia qui</p><p className="mt-2 text-[13px] text-[#74829c]">Carica un PDF per creare la prima polizza.</p><Link href="/documents" className="atlas-btn-primary mt-4 inline-flex px-5 py-3">Aggiungi polizza</Link></div>}
      <Link href="/analysis" className="flex items-center gap-3 rounded-[20px] border border-[#e5eaf3] bg-white p-5"><CalendarDays className="h-6 w-6 text-[#1766f7]"/><span className="flex-1"><span className="block text-[13px] font-bold">Prossimo rinnovo</span><span className="text-[12px] text-muted">{nextRenewal ? nextRenewal.renewalDate+" · "+nextRenewal.provider : "Nessuna data confermata"}</span></span><span className="text-[#1766f7]">→</span></Link>
      <details className="rounded-[20px] border border-[#e5eaf3] bg-white p-4"><summary className="cursor-pointer text-[13px] font-bold text-[#101e3c]">Archivio e attività · {documentStats.totalDocuments} documenti</summary><div className="mt-4 space-y-4">
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
            title="Documenti recenti"
            description="I tuoi PDF nell'archivio privato."
            action={<LinkAction href="/documents">Tutti i documenti</LinkAction>}
            padding="none"
          >
            {recentDocuments.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {recentDocuments.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-card-muted sm:px-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--danger-bg)] text-[var(--danger-text)]">
                      <IconDocuments className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {document.fileName}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {getActivityCopy(document.status)} ·{" "}
                        {formatRelativeTime(document.createdAt)}
                      </span>
                    </span>
                    <DocumentStatusBadge status={document.status} />
                    <IconChevronRight className="hidden h-4 w-4 text-muted sm:block" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-[13px] font-medium text-foreground">
                  Nessun documento caricato
                </p>
                <p className="mt-1 text-[12px] text-muted">
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
                <p className="text-[13px] font-medium text-foreground">
                  Nessuna polizza strutturata
                </p>
                <p className="mt-1 text-[12px] text-muted">
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
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning-bg)] text-[var(--warning-text)]">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    {pendingReviewPolicies.length} bozze AI
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    Conferma i dati estratti prima di usarli come riferimento.
                  </p>
                  <Link
                    href={`/policies/${pendingReviewPolicies[0].id}/edit`}
                    className="mt-3 inline-flex text-[12px] font-medium text-accent hover:text-accent"
                  >
                    Inizia revisione
                  </Link>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Strumenti" padding="sm">
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

          <div className="rounded-2xl border border-border bg-accent-soft px-4 py-3 text-[12px] leading-relaxed text-muted">
            Insura e indipendente: non vendiamo polizze ne riceviamo commissioni da
            assicuratori.
          </div>
        </div>
      </div>
      </div></details>
    </PageShell>
  );
}
