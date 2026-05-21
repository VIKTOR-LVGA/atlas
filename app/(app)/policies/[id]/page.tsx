import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { AlertItem } from "@/components/ui/AlertItem";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkAction } from "@/components/ui/LinkAction";
import { IconCheck, IconX, IconAlert } from "@/components/icons";
import {
  getPolicyById,
  getDocumentsByPolicyId,
  categoryLabels,
  statusLabels,
} from "@/lib/mock-data";
import { categoryIconBg, PolicyCategoryIcon, ScoreRing } from "@/lib/policy-ui";
import { formatCHF, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const policy = getPolicyById(id);
  return { title: policy?.name ?? "Polizza" };
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const policy = getPolicyById(id);
  if (!policy) notFound();

  const policyDocs = getDocumentsByPolicyId(id);
  const healthVariant =
    policy.healthStatus === "ok"
      ? "ok"
      : policy.healthStatus === "attention"
        ? "attention"
        : "critical";

  return (
    <div className="space-y-5">
      <Link href="/policies" className="text-[12px] text-slate-500 hover:text-slate-700">
        ← Le mie polizze
      </Link>

      <PageHeader
        title={policy.name}
        description={`${policy.insurer} · ${policy.policyNumber} · ${categoryLabels[policy.category]}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge variant={healthVariant} />
            <StatusBadge
              variant={
                policy.status === "active"
                  ? "active"
                  : policy.status === "expiring"
                    ? "expiring"
                    : "review"
              }
              label={statusLabels[policy.status]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Premio annuo", value: formatCHF(policy.annualPremium) },
          {
            label: "Franchigia",
            value: policy.deductible ? formatCHF(policy.deductible) : "Nessuna",
          },
          { label: "Punteggio copertura", value: `${policy.coverageScore}%` },
          { label: "Prossimo rinnovo", value: formatDate(policy.renewalDate) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] text-slate-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${categoryIconBg[policy.category]}`}
        >
          <PolicyCategoryIcon category={policy.category} />
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-slate-900">{policy.insurer}</p>
          <p className="text-[11px] text-slate-500">
            Rinnovo tra {policy.daysUntilRenewal} giorni
          </p>
        </div>
        <ScoreRing score={policy.coverageScore} size={48} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Coperture incluse">
          <ul className="space-y-2">
            {policy.includedCoverages.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-[12px] text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <IconCheck className="h-3 w-3" />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Esclusioni">
          <ul className="space-y-2">
            {policy.excludedCoverages.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-[12px] text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <IconX className="h-3 w-3" />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {policy.alerts.length > 0 && (
        <SectionCard title="Avvisi" padding="sm">
          <div className="space-y-1">
            {policy.alerts.map((a) => (
              <AlertItem
                key={a.id}
                title={a.title}
                description={a.description}
                severity={a.severity}
                icon={<IconAlert className="h-4 w-4" />}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {policy.recommendations.length > 0 && (
        <SectionCard
          title="Raccomandazioni"
          action={<LinkAction href="/recommendations">Tutte →</LinkAction>}
        >
          <div className="space-y-3">
            {policy.recommendations.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
              >
                <StatusBadge
                  variant={
                    r.priority === "high"
                      ? "critical"
                      : r.priority === "medium"
                        ? "attention"
                        : "ok"
                  }
                />
                <h3 className="mt-2 text-[13px] font-medium text-slate-900">{r.title}</h3>
                <p className="mt-1 text-[12px] text-slate-600">{r.description}</p>
                <p className="mt-2 text-[12px] text-blue-600">{r.nextStep}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Documenti collegati">
        {policyDocs.length === 0 ? (
          <p className="text-[12px] text-slate-500">Nessun documento collegato.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {policyDocs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between py-3 first:pt-0"
              >
                <div>
                  <p className="text-[13px] font-medium text-slate-900">{doc.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {doc.type} · {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                <LinkAction href="/documents">Apri</LinkAction>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
