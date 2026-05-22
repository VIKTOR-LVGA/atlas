import Link from "next/link";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconDocuments, IconPolicies } from "@/components/icons";

export const metadata = { title: "Dettaglio polizza" };

export default function PolicyDetailPage() {
  return (
    <div className="space-y-5">
      <Link href="/policies" className="text-[12px] text-slate-500 hover:text-slate-700">
        Torna alle polizze
      </Link>

      <PageHeader
        title="Dettaglio polizza"
        description="Il dettaglio sara disponibile solo per polizze estratte da documenti reali."
        action={<StatusBadge variant="processing" label="Analisi in attesa" />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Polizza non disponibile">
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <IconPolicies className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-slate-900">
                Nessuna polizza analizzata
              </h2>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">
                Non esiste ancora un record di polizza reale da mostrare. Carica una polizza PDF
                per iniziare.
              </p>
              <PrimaryButton href="/documents" className="mt-5">
                Carica un documento
              </PrimaryButton>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Dati attesi" padding="sm">
          <div className="space-y-3 text-[12px] text-slate-600">
            <div className="rounded-xl border border-slate-100 p-3">
              Premio, scadenza e compagnia arriveranno dall&apos;estrazione del PDF.
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              Coperture, esclusioni e alert resteranno bloccati fino all&apos;analisi.
            </div>
            <Link
              href="/documents"
              className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 font-medium text-blue-700"
            >
              <IconDocuments className="h-4 w-4" />
              Apri documenti reali
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
