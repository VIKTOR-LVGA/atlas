import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  FileText,
  Layers3,
  PencilLine,
  Sparkles,
  Users,
} from "lucide-react";
import { PolicyDeleteForm } from "@/components/policies/PolicyDeleteForm";
import { IconPolicies } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCurrentUserPolicyById } from "@/lib/policies";
import {
  getPolicyCoverages,
  getPolicyDetailRows,
  getPolicyExtractionMetadata,
  getPolicyFieldConfidenceRows,
  getPolicyInsuredPeople,
  getPolicyProducts,
  getPolicyTypeLabel,
} from "@/lib/policy-types";
import { formatCHF, formatDate, formatDateTime } from "@/lib/utils";
import type {
  PolicyCoverageDetail,
  PolicyInsuredPersonDetail,
  PolicyPremiumFrequency,
  PolicyProductDetail,
} from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Dettaglio polizza" };

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

function ConfidencePill({
  confidence,
  uncertain,
}: {
  confidence?: number | null;
  uncertain?: boolean | null;
}) {
  const label =
    confidence === null || confidence === undefined
      ? "Confidenza n/d"
      : `${confidence}%`;
  const tone = uncertain
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}
    >
      {uncertain ? "Incerto" : label}
    </span>
  );
}

function AmountText({ value }: { value?: number | null }) {
  return value === null || value === undefined ? null : <>{formatCHF(value)}</>;
}

function CoverageCard({ coverage }: { coverage: PolicyCoverageDetail }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-slate-900">
            {coverage.name}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {coverage.category_label ?? coverage.coverage_type ?? "Copertura"}
          </p>
        </div>
        <ConfidencePill
          confidence={coverage.confidence}
          uncertain={coverage.uncertain}
        />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="text-slate-400">Premio</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            <AmountText value={coverage.premium_amount} />{" "}
            {coverage.premium_frequency
              ? `/ ${premiumFrequencyLabels[coverage.premium_frequency].toLowerCase()}`
              : ""}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Franchise</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            <AmountText value={coverage.franchise ?? coverage.deductible} />
          </dd>
        </div>
      </dl>
      {coverage.notes && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          {coverage.notes}
        </p>
      )}
    </div>
  );
}

function InsuredPersonCard({ person }: { person: PolicyInsuredPersonDetail }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-slate-900">
            {person.name ?? "Persona assicurata"}
          </p>
          {person.birth_date && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              Nato/a il {formatDate(person.birth_date)}
            </p>
          )}
          {person.insured_number && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              N. assicurato {person.insured_number}
            </p>
          )}
        </div>
        <ConfidencePill confidence={person.confidence} uncertain={person.uncertain} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="text-slate-400">Premio</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            <AmountText value={person.premium_amount} />
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Franchise</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            <AmountText value={person.franchise ?? person.deductible} />
          </dd>
        </div>
        {person.model && (
          <div className="col-span-2">
            <dt className="text-slate-400">Modello</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{person.model}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function ProductCard({ product }: { product: PolicyProductDetail }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-slate-900">
            {product.name}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {product.coverage_type ?? "Prodotto"}
          </p>
        </div>
        <ConfidencePill confidence={product.confidence} uncertain={product.uncertain} />
      </div>
      {product.premium_amount !== null && product.premium_amount !== undefined && (
        <p className="mt-2 text-[11px] font-medium text-slate-800">
          {formatCHF(product.premium_amount)}
        </p>
      )}
    </div>
  );
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const policy = await getCurrentUserPolicyById(id);

  if (!policy) {
    notFound();
  }
  const policyTypeLabel = getPolicyTypeLabel(
    policy.policyType,
    policy.policyCategoryLabel
  );
  const detailRows = getPolicyDetailRows(policy.policyType, policy.details);
  const coverages = getPolicyCoverages(policy.details);
  const insuredPeople = getPolicyInsuredPeople(policy.details);
  const products = getPolicyProducts(policy.details);
  const fieldConfidenceRows = getPolicyFieldConfidenceRows(policy.details);
  const uncertainFields = fieldConfidenceRows.filter((row) => row.uncertain);
  const extractionMetadata = getPolicyExtractionMetadata(policy.details);

  return (
    <div className="space-y-5">
      <Link href="/policies" className="text-[12px] text-slate-500 hover:text-slate-700">
        Torna alle polizze
      </Link>

      <PageHeader
        title={policy.provider}
        description={policyTypeLabel}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {policy.requiresReview && (
              <StatusBadge variant="attention" label="Da rivedere" />
            )}
            <StatusBadge
              variant={policy.status === "active" ? "active" : "neutral"}
              label={policy.status === "active" ? "Attiva" : policy.status}
            />
          </div>
        }
      />

      {policy.source === "ai_draft" && (
        <SectionCard
          title="Bozza estratta da Atlas"
          description="Estrazione AI dal testo PDF con normalizzazione per documenti assicurativi svizzeri."
          action={
            <StatusBadge
              variant={policy.requiresReview ? "attention" : "ok"}
              label={policy.requiresReview ? "Revisione richiesta" : "Revisionata"}
            />
          }
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    Draft precompilato
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                    Atlas ha riconosciuto compagnia, categoria, coperture e campi
                    strutturati quando presenti nel PDF. I campi incerti restano
                    da confermare prima di usarli come dato assicurativo affidabile.
                  </p>
                  <Link
                    href={`/policies/${policy.id}/edit`}
                    className="mt-3 inline-flex rounded-lg bg-white px-3.5 py-2 text-[12px] font-medium text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100 hover:bg-indigo-50"
                  >
                    Rivedi bozza
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-600">
                  Confidenza estrazione
                </span>
                <span className="text-indigo-600">
                  {policy.extractionConfidence === null
                    ? "Da verificare"
                    : `${policy.extractionConfidence}%`}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.max(
                      12,
                      Math.min(100, policy.extractionConfidence ?? 86)
                    )}%`,
                  }}
                />
              </div>
              {policy.extractionNotes && (
                <p className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
                  {policy.extractionNotes}
                </p>
              )}
              {uncertainFields.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {uncertainFields.length} campi segnati come incerti
                    dall&apos;estrazione.
                  </span>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <SectionCard title="Dati polizza" padding="md">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Compagnia</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.provider}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Categoria</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policyTypeLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Numero polizza</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.policyNumber ?? "Da completare"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Premio</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.premiumAmount === null
                  ? "Da completare"
                  : formatCHF(policy.premiumAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">
                Frequenza premio
              </dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {premiumFrequencyLabels[policy.premiumFrequency]}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Valuta</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.currency}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Franchigia</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.deductible === null
                  ? "Da completare"
                  : formatCHF(policy.deductible)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">
                Somma copertura
              </dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.coverageAmount === null
                  ? "Da completare"
                  : formatCHF(policy.coverageAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Data inizio</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.startDate ? formatDate(policy.startDate) : "Da completare"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Data fine</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.endDate ? formatDate(policy.endDate) : "Da completare"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Data rinnovo</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.renewalDate ? formatDate(policy.renewalDate) : "Da completare"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Creata il</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {formatDateTime(policy.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Aggiornata il</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {formatDateTime(policy.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] uppercase text-slate-400">Note</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
              {policy.notes || "Nessuna nota salvata."}
            </p>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title={`Dettagli ${policyTypeLabel}`} padding="md">
            {detailRows.length > 0 ? (
              <dl className="space-y-3">
                {detailRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <dt className="text-[10px] uppercase tracking-wide text-slate-400">
                      {row.label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-[12px] font-medium text-slate-900">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-[12px] leading-relaxed text-slate-500">
                Nessun dettaglio specifico salvato per questa categoria.
              </p>
            )}
          </SectionCard>

          {coverages.length > 0 && (
            <SectionCard
              title="Coperture rilevate"
              description="Gruppi o prodotti presenti nello stesso PDF."
              padding="md"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                  <Layers3 className="h-4 w-4 text-blue-600" />
                  {coverages.length} copertura{coverages.length === 1 ? "" : "e"}
                </div>
                <div className="space-y-2">
                  {coverages.map((coverage, index) => (
                    <CoverageCard
                      key={`${coverage.name}-${index}`}
                      coverage={coverage}
                    />
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {insuredPeople.length > 0 && (
            <SectionCard
              title="Persone assicurate"
              description="Premi e franchigie quando separati nel documento."
              padding="md"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                  <Users className="h-4 w-4 text-blue-600" />
                  {insuredPeople.length} persona
                  {insuredPeople.length === 1 ? "" : "e"}
                </div>
                {insuredPeople.map((person, index) => (
                  <InsuredPersonCard
                    key={`${person.name ?? "insured"}-${index}`}
                    person={person}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {products.length > 0 && (
            <SectionCard title="Prodotti estratti" padding="md">
              <div className="space-y-2">
                {products.map((product, index) => (
                  <ProductCard key={`${product.name}-${index}`} product={product} />
                ))}
              </div>
            </SectionCard>
          )}

          {fieldConfidenceRows.length > 0 && (
            <SectionCard
              title="Confidenza campi"
              description="Lettura per campo, utile nella revisione."
              padding="md"
            >
              <div className="space-y-2">
                {fieldConfidenceRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-900">
                          {row.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {row.value || "Non rilevato"}
                        </p>
                      </div>
                      <ConfidencePill
                        confidence={row.confidence}
                        uncertain={row.uncertain}
                      />
                    </div>
                    {row.evidence && (
                      <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                        {row.evidence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {Boolean(
            extractionMetadata.matched_keywords?.length ||
              extractionMetadata.inferred_sections?.length ||
              extractionMetadata.warnings?.length ||
              extractionMetadata.provider_aliases_matched?.length ||
              extractionMetadata.detected_languages?.length ||
              extractionMetadata.source_hints?.length
          ) && (
            <SectionCard title="Metadati estrazione" padding="md">
              <div className="space-y-3 text-[11px] leading-relaxed">
                {Boolean(extractionMetadata.matched_keywords?.length) && (
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Keyword trovate
                    </div>
                    <p className="mt-1 text-slate-500">
                      {extractionMetadata.matched_keywords?.join(", ")}
                    </p>
                  </div>
                )}
                {Boolean(extractionMetadata.inferred_sections?.length) && (
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      Sezioni inferite
                    </div>
                    <p className="mt-1 text-slate-500">
                      {extractionMetadata.inferred_sections?.join(", ")}
                    </p>
                  </div>
                )}
                {Boolean(extractionMetadata.provider_aliases_matched?.length) && (
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                      Alias compagnia
                    </div>
                    <p className="mt-1 text-slate-500">
                      {extractionMetadata.provider_aliases_matched?.join(", ")}
                    </p>
                  </div>
                )}
                {Boolean(extractionMetadata.detected_languages?.length) && (
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                      Lingue rilevate
                    </div>
                    <p className="mt-1 uppercase text-slate-500">
                      {extractionMetadata.detected_languages?.join(", ")}
                    </p>
                  </div>
                )}
                {Boolean(extractionMetadata.warnings?.length) && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-amber-700">
                    <p className="font-semibold">Da verificare</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {extractionMetadata.warnings?.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Documento collegato" padding="md">
            {policy.document ? (
              <Link
                href={`/documents/${policy.document.id}`}
                className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 hover:bg-blue-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-slate-900">
                    {policy.document.fileName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    Apri il PDF sorgente
                  </span>
                </span>
              </Link>
            ) : (
              <p className="text-[12px] leading-relaxed text-slate-500">
                Nessun PDF collegato. Puoi aggiungerlo dalla modifica della polizza.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Azioni" padding="md">
            <div className="space-y-3">
              <Link
                href={`/policies/${policy.id}/edit`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-blue-700"
              >
                <PencilLine className="h-4 w-4" />
                Modifica polizza
              </Link>
              <PolicyDeleteForm policyId={policy.id} />
              <Link
                href="/policies"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <IconPolicies className="h-4 w-4" />
                Tutte le polizze
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
