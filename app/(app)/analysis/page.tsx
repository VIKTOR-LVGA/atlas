import Link from "next/link";
import { CalendarDays, Wallet } from "lucide-react";
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
  const priced = verifiedPolicies.filter((policy) => policy.currency === "CHF" && policy.premiumAmount !== null && Number.isFinite(policy.premiumAmount) && policy.premiumAmount >= 0);
  const annualFactor = { monthly: 12, quarterly: 4, semiannual: 2, annual: 1 } as const;
  const annualTotal = priced.reduce((sum, policy) => sum + (policy.premiumAmount ?? 0) * annualFactor[policy.premiumFrequency], 0);
  const formatMoney = (value: number) => new Intl.NumberFormat("de-CH", {style:"currency",currency:"CHF",maximumFractionDigits:2}).format(value);
  const renewalItems = verifiedPolicies.filter((p) => p.renewalDate && /^\\d{4}-\\d{2}-\\d{2}$/.test(p.renewalDate)).sort((a,b) => (a.renewalDate ?? "").localeCompare(b.renewalDate ?? ""));
  const categoryTotals = priced.reduce<Record<string,number>>((totals,policy) => {const key = policy.policyCategoryLabel || policy.policyType; totals[key] = (totals[key] ?? 0) + (policy.premiumAmount ?? 0) * annualFactor[policy.premiumFrequency]; return totals;}, {});

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
        title="Analisi e costi"
        description="I dati verificati delle tue polizze, in un unico posto. Analisi avanzate in preparazione."
        action={
          <PrimaryButton href="/documents" icon={<IconPlus className="h-4 w-4" />}>
            Carica PDF
          </PrimaryButton>
        }
      />

      <section aria-label="Riepilogo premi confermati" className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] border border-[#e5eaf3] bg-white p-5 shadow-sm"><Wallet className="h-5 w-5 text-[#3157eb]"/><p className="mt-3 text-[12px] text-muted">Premi annuali confermati</p><p className="mt-1 text-[25px] font-extrabold text-foreground">{priced.length ? formatMoney(annualTotal) : "—"}</p><p className="mt-2 text-[11px] text-muted">{priced.length} polizze CHF con premio confermato</p></div>
        <div className="rounded-[22px] border border-[#e5eaf3] bg-white p-5 shadow-sm"><Wallet className="h-5 w-5 text-[#3157eb]"/><p className="mt-3 text-[12px] text-muted">Equivalente mensile</p><p className="mt-1 text-[25px] font-extrabold text-foreground">{priced.length ? formatMoney(annualTotal / 12) : "—"}</p><p className="mt-2 text-[11px] text-muted">Calcolo indicativo: premio annualizzato / 12</p></div>
      </section>
      <p className="text-[12px] text-muted">Sono esclusi i premi non confermati, mancanti o in valuta diversa da CHF. I valori non costituiscono una previsione dei pagamenti.</p>
      {Object.keys(categoryTotals).length > 0 ? <SectionCard title="Costi per categoria" padding="sm"><div className="space-y-3">{Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1]).map(([category,amount])=><div key={category}><div className="flex items-center justify-between gap-3 text-[12px]"><span className="font-semibold capitalize text-foreground">{category}</span><span className="font-bold text-foreground">{formatMoney(amount)} / anno</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef2ff]"><div className="h-full rounded-full bg-[#3157eb]" style={{width: `${annualTotal > 0 ? amount / annualTotal * 100 : 0}%`}} /></div></div>)}</div></SectionCard> : null}
      <SectionCard title="Scadenze delle polizze confermate" padding="sm">
        {renewalItems.length ? <div className="space-y-2">{renewalItems.map(policy=><Link key={policy.id} href={`/policies/${policy.id}`} className="flex items-center gap-3 rounded-[16px] border border-border bg-white p-3"><CalendarDays className="h-5 w-5 shrink-0 text-[#3157eb]"/><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">{policy.provider}</span><span className="text-[11px] text-muted">Data di rinnovo registrata · non equivale al termine di disdetta</span></span><time dateTime={policy.renewalDate ?? undefined} className="shrink-0 text-[12px] font-semibold">{policy.renewalDate}</time></Link>)}</div> : <p className="text-[12px] text-muted">Nessuna data di rinnovo confermata disponibile. Apri una polizza per verificarla.</p>}
      </SectionCard>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Documenti"
          value={String(documentStats.totalDocuments)}
          subtext={`${documentStats.analyzedDocuments} analizzati`}
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Polizze registrate"
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
                  : "Dopo l'estrazione AI da un PDF, Insura potra confrontare coperture e segnalare criticita."
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
                className="flex items-start gap-3 rounded-xl border border-border p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card-muted text-[11px] font-semibold text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground">{step.label}</p>
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
          <Link href="/documents" className="text-[12px] font-medium text-accent">
            Tutti
          </Link>
        }
        padding="sm"
      >
        {recentDocuments.length > 0 ? (
          <ul className="divide-y divide-border-subtle">
            {recentDocuments.map((document) => (
              <li key={document.id}>
                <Link
                  href={`/documents/${document.id}`}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-foreground">
                      {document.fileName}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
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
          <p className="text-[12px] text-muted">Nessun documento caricato.</p>
        )}
      </SectionCard>

      <SectionCard title="Funzionalità in preparazione" padding="sm">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            "Punteggio copertura",
            "Rischi e doppie coperture",
            "Opportunita di risparmio",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl border border-border p-3"
            >
              <IconCheck className="h-4 w-4 text-muted" />
              <span className="text-[12px] text-muted">{item}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
