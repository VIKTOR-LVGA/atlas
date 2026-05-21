import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkAction } from "@/components/ui/LinkAction";
import {
  IconFolder,
  IconUpload,
  IconShield,
  IconSearch,
  IconFilter,
  IconDocuments,
} from "@/components/icons";
import { documents, dashboardStats } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Documenti" };

const docStatusMap = {
  completed: "completed" as const,
  analyzing: "processing" as const,
  uploaded: "processing" as const,
  error: "error" as const,
};

const docStatusLabel = {
  completed: "Completato",
  analyzing: "In elaborazione",
  uploaded: "Caricato",
  error: "Errore OCR",
};

const categories = [
  { label: "Auto", count: 8 },
  { label: "Mobilia", count: 6 },
  { label: "Salute", count: 5 },
  { label: "RC", count: 4 },
  { label: "Altro", count: 13 },
];

export default function DocumentsPage() {
  const recent = documents.slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documenti"
        description="Carica e gestisci le tue polizze assicurative."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Archivio documenti"
          value={String(dashboardStats.documentsTotal)}
          subtext={`${dashboardStats.documentsAnalyzed} analizzati`}
          variant="blue"
          icon={<IconFolder className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Upload recenti"
          value="4"
          subtext="Ultimi 7 giorni"
          variant="blue"
          icon={<IconUpload className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Stato OCR"
          value={`${dashboardStats.ocrPercent}%`}
          subtext="1 errore · 2 in corso"
          variant="green"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <div className="flex min-h-[108px] flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <IconDocuments className="h-[18px] w-[18px]" />
          </div>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Categorie
          </p>
          <ul className="mt-2 space-y-1">
            {categories.map((c) => (
              <li key={c.label} className="flex justify-between text-[12px]">
                <span className="text-slate-600">{c.label}</span>
                <span className="font-medium text-slate-900">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard padding="none">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-50 p-4">
              <div className="relative min-w-[200px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Cerca documento..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-blue-400"
                />
              </div>
              <select className="rounded-lg border border-slate-200 px-3 py-2 text-[12px]">
                <option>Categoria</option>
              </select>
              <select className="rounded-lg border border-slate-200 px-3 py-2 text-[12px]">
                <option>Stato</option>
              </select>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600"
              >
                <IconFilter className="h-3.5 w-3.5" />
                Filtri
              </button>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] uppercase text-slate-400">
                  <th className="px-5 py-2 text-left">Nome documento</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Stato OCR</th>
                  <th className="px-3 py-2 text-left">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold text-red-600">
                          PDF
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">{doc.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{doc.category}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(doc.uploadedAt)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        variant={docStatusMap[doc.status]}
                        label={docStatusLabel[doc.status]}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <LinkAction href="#">Apri</LinkAction>
                        <LinkAction href="/analysis">Analizza</LinkAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center gap-1 border-t border-slate-50 py-3">
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[12px] text-white">
                1
              </button>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard padding="md">
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <IconUpload className="h-6 w-6" />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-slate-900">Trascina i file qui</p>
              <p className="mt-1 text-[11px] text-slate-500">PDF, JPG, PNG · max 10 MB</p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
              >
                Seleziona file
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Upload recenti" padding="sm">
            <ul className="divide-y divide-slate-50">
              {recent.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-slate-800">{doc.name}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(doc.uploadedAt)}</p>
                  </div>
                  <StatusBadge
                    variant={docStatusMap[doc.status]}
                    label={docStatusLabel[doc.status]}
                  />
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Sicurezza e riservatezza</p>
            <p className="text-[12px] text-slate-600">
              Crittografia end-to-end, hosting in Svizzera, conformità nLPD.
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
        >
          Scopri come proteggiamo i tuoi dati
        </Link>
      </div>
    </div>
  );
}
