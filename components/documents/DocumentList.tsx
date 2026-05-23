"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { KeyboardEvent, SyntheticEvent } from "react";
import {
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  MoreVertical,
} from "lucide-react";
import { DocumentDeleteForm } from "@/components/documents/DocumentDeleteForm";
import { DocumentAnalysisForm } from "@/components/documents/DocumentAnalysisForm";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import type { UserDocument } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconUpload } from "@/components/icons";
import { cn, formatDate, formatFileSize } from "@/lib/utils";

function getDocumentHref(document: UserDocument) {
  return `/documents/${document.id}`;
}

function getDownloadHref(document: UserDocument) {
  return `/documents/${document.id}/download`;
}

function stopRowNavigation(event: SyntheticEvent) {
  event.stopPropagation();
}

function DocumentButtonLink({
  document,
  kind,
  className,
}: {
  document: UserDocument;
  kind: "detail" | "download";
  className?: string;
}) {
  const sharedClassName = cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted shadow-sm transition hover:-translate-y-px hover:border-border hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
    className
  );

  if (kind === "detail") {
    return (
      <Link
        href={getDocumentHref(document)}
        title="Apri dettagli"
        aria-label={`Apri dettagli di ${document.fileName}`}
        className={sharedClassName}
        onClick={stopRowNavigation}
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <a
      href={getDownloadHref(document)}
      title="Scarica PDF"
      aria-label={`Scarica ${document.fileName}`}
      className={sharedClassName}
      onClick={stopRowNavigation}
    >
      <Download className="h-4 w-4" />
    </a>
  );
}

function MobileActionMenu({ document }: { document: UserDocument }) {
  return (
    <details className="relative">
      <summary
        title="Altre azioni"
        aria-label={`Altre azioni per ${document.fileName}`}
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-card text-muted shadow-sm transition hover:border-border hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 [&::-webkit-details-marker]:hidden"
        onClick={stopRowNavigation}
      >
        <MoreVertical className="h-4 w-4" />
      </summary>
      <div
        className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-[var(--shadow-card)]"
        onClick={stopRowNavigation}
      >
        <Link
          href={getDocumentHref(document)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-muted-foreground transition hover:bg-accent-soft hover:text-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Apri dettagli
        </Link>
        <a
          href={getDownloadHref(document)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-muted-foreground transition hover:bg-accent-soft hover:text-accent"
        >
          <Download className="h-3.5 w-3.5" />
          Scarica PDF
        </a>
        <DocumentAnalysisForm
          documentId={document.id}
          documentStatus={document.status}
          variant="menu"
        />
        <DocumentDeleteForm documentId={document.id} variant="menu" />
      </div>
    </details>
  );
}

function openDocumentFromKeyboard(
  event: KeyboardEvent<HTMLElement>,
  openDocument: () => void
) {
  if (event.target !== event.currentTarget) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openDocument();
  }
}

function DocumentEmptyState() {
  return (
    <div className="p-4 sm:p-6">
      <EmptyState
        icon={<IconUpload className="h-6 w-6" />}
        title="Nessun PDF in archivio"
        description="Carica la prima polizza per analizzarla con AI e creare una bozza strutturata."
        className="border-none bg-transparent py-8"
      />
    </div>
  );
}

export function DocumentList({ documents }: { documents: UserDocument[] }) {
  const router = useRouter();

  if (documents.length === 0) {
    return <DocumentEmptyState />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] text-[12px]">
          <thead>
            <tr className="border-b border-border-subtle text-[10px] uppercase text-muted">
              <th className="px-5 py-2 text-left">Nome documento</th>
              <th className="px-3 py-2 text-left">Dimensione</th>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Stato</th>
              <th className="px-5 py-2 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const openDocument = () => router.push(getDocumentHref(document));

              return (
                <tr
                  key={document.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Apri ${document.fileName}`}
                  className="group cursor-pointer border-b border-border-subtle outline-none transition hover:bg-accent-soft focus-visible:bg-accent-soft"
                  onClick={openDocument}
                  onKeyDown={(event) => openDocumentFromKeyboard(event, openDocument)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)] transition group-hover:bg-card">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {document.fileName}
                        </p>
                        <p className="truncate text-[10px] text-muted">
                          {document.mimeType ?? "application/pdf"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-muted">
                    {formatFileSize(document.fileSize)}
                  </td>
                  <td className="px-3 py-3.5 text-muted">
                    {formatDate(document.createdAt)}
                  </td>
                  <td className="px-3 py-3.5">
                    <DocumentStatusBadge status={document.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={stopRowNavigation}
                    >
                      <DocumentButtonLink document={document} kind="detail" />
                      <DocumentButtonLink document={document} kind="download" />
                      <DocumentAnalysisForm
                        documentId={document.id}
                        documentStatus={document.status}
                        variant="icon"
                      />
                      <DocumentDeleteForm documentId={document.id} variant="icon" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border-subtle md:hidden">
        {documents.map((document) => {
          const openDocument = () => router.push(getDocumentHref(document));

          return (
            <article
              key={document.id}
              role="link"
              tabIndex={0}
              aria-label={`Apri ${document.fileName}`}
              className="group cursor-pointer px-4 py-4 outline-none transition hover:bg-accent-soft focus-visible:bg-accent-soft"
              onClick={openDocument}
              onKeyDown={(event) => openDocumentFromKeyboard(event, openDocument)}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--danger-bg)] text-[var(--danger-text)] transition group-hover:bg-card">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {document.fileName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {formatFileSize(document.fileSize)} / {formatDate(document.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:text-accent" />
                  </div>
                  <div className="mt-2">
                    <DocumentStatusBadge status={document.status} />
                  </div>
                </div>
              </div>
              <div
                className="mt-3 flex items-center justify-between gap-2 pl-[52px]"
                onClick={stopRowNavigation}
              >
                <div className="flex items-center gap-1.5">
                  <DocumentButtonLink document={document} kind="detail" />
                  <DocumentButtonLink document={document} kind="download" />
                  <DocumentAnalysisForm
                    documentId={document.id}
                    documentStatus={document.status}
                    variant="icon"
                  />
                  <DocumentDeleteForm documentId={document.id} variant="icon" />
                </div>
                <MobileActionMenu document={document} />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
