import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/ui/StatusBadge";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import {
  IconFolder,
  IconUpload,
  IconShield,
  IconSearch,
  IconFilter,
  IconDocuments,
} from "@/components/icons";
import { getCurrentUserDocuments } from "@/lib/documents";
import { formatDate, formatFileSize } from "@/lib/utils";

export const metadata = { title: "Documenti" };

const docStatusMap: Record<string, StatusBadgeVariant> = {
  completed: "completed",
  analyzing: "processing",
  uploaded: "processing",
  error: "error",
};

const docStatusLabel: Record<string, string> = {
  completed: "Completato",
  analyzing: "In elaborazione",
  uploaded: "Caricato",
  error: "Errore",
};

function getStatusVariant(status: string) {
  return docStatusMap[status] ?? "neutral";
}

function getStatusLabel(status: string) {
  return docStatusLabel[status] ?? status;
}

export default async function DocumentsPage() {
  const documents = await getCurrentUserDocuments();
  const recent = documents.slice(0, 4);
  const uploadedCount = documents.filter(
    (document) => document.status === "uploaded"
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documenti"
        description="Carica e gestisci le tue polizze assicurative."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Archivio documenti"
          value={String(documents.length)}
          subtext="PDF caricati"
          variant="blue"
          icon={<IconFolder className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Upload recenti"
          value={String(recent.length)}
          subtext="Piu recenti"
          variant="blue"
          icon={<IconUpload className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Stato upload"
          value={String(uploadedCount)}
          subtext="Pronti in archivio"
          variant="green"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <div className="flex min-h-[108px] flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <IconDocuments className="h-[18px] w-[18px]" />
          </div>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Formato
          </p>
          <p className="mt-2 text-[14px] font-semibold text-slate-900">PDF assicurativi</p>
          <p className="mt-1 text-[11px] text-slate-500">Archivio privato Supabase</p>
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
                  <th className="px-3 py-2 text-left">Dimensione</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Stato</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold text-red-600">
                            PDF
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-400">
                              {doc.mimeType ?? "application/pdf"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{formatDate(doc.createdAt)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge
                          variant={getStatusVariant(doc.status)}
                          label={getStatusLabel(doc.status)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <p className="text-[13px] font-medium text-slate-800">
                        Nessun PDF caricato.
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Il primo documento apparira qui dopo l&apos;upload.
                      </p>
                    </td>
                  </tr>
                )}
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
            <DocumentUploadForm />
          </SectionCard>

          <SectionCard title="Upload recenti" padding="sm">
            {recent.length > 0 ? (
              <ul className="divide-y divide-slate-50">
                {recent.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2.5 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-slate-800">
                        {doc.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatDate(doc.createdAt)}</p>
                    </div>
                    <StatusBadge
                      variant={getStatusVariant(doc.status)}
                      label={getStatusLabel(doc.status)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-[12px] text-slate-500">
                Gli upload recenti compariranno qui.
              </p>
            )}
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
