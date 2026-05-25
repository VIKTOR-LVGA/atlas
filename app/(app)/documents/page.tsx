import Link from "next/link";
import { Sparkles, Shield } from "lucide-react";
import { DocumentIntelligenceArchive } from "@/components/documents/DocumentIntelligenceArchive";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { DocumentWorkflowStrip } from "@/components/documents/DocumentWorkflowStrip";
import {
  IconDocuments,
  IconFolder,
  IconUpload,
} from "@/components/icons";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { RevealStagger } from "@/components/motion/RevealStagger";
import {
  atlasAsideColumn,
  atlasCard,
  atlasKpiRow,
  atlasMainAside,
  atlasMainColumn,
} from "@/lib/atlas-ui";
import { getCurrentUserDocuments } from "@/lib/documents";
import {
  buildDocumentsIntelligence,
  countDocumentsByFilter,
} from "@/lib/document-intelligence";
import { getCurrentUserPolicies } from "@/lib/policies";
import { formatDate, formatFileSize } from "@/lib/utils";

export const metadata = { title: "Documenti" };

export default async function DocumentsPage() {
  const [documents, policies] = await Promise.all([
    getCurrentUserDocuments(),
    getCurrentUserPolicies(),
  ]);

  const views = buildDocumentsIntelligence(documents, policies);
  const filterCounts = countDocumentsByFilter(views);
  const recent = views.slice(0, 4);

  const needsReviewCount = filterCounts.needs_review;
  const confirmedCount = filterCounts.confirmed;

  return (
    <PageShell>
      <RevealStagger>
        <PageHeader
          title="Documenti"
          description="Centro operativo per PDF assicurativi: caricamento, analisi AI e collegamento alle polizze strutturate."
        />

        <div className={atlasKpiRow}>
          <MetricCard
            label="Archivio"
            value={String(documents.length)}
            subtext="PDF nel tuo archivio"
            variant="blue"
            icon={<IconFolder className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Da analizzare"
            value={String(filterCounts.unanalyzed)}
            subtext="Pronti per estrazione"
            variant="yellow"
            icon={<IconUpload className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Analizzati"
            value={String(filterCounts.analyzed)}
            subtext={`${confirmedCount} confermati`}
            variant="green"
            icon={<IconDocuments className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Revisione"
            value={String(needsReviewCount)}
            subtext={
              filterCounts.error > 0
                ? `${filterCounts.error} con errore`
                : "Bozze da verificare"
            }
            variant={needsReviewCount > 0 || filterCounts.error > 0 ? "red" : "indigo"}
            icon={<Sparkles className="h-[18px] w-[18px]" />}
          />
        </div>

        <div className={atlasMainAside}>
          <div className={atlasMainColumn}>
            <SectionCard
              title="Archivio documenti"
              description="Ogni riga mostra stato, indicatori e prossima azione."
              padding="none"
            >
              <DocumentIntelligenceArchive views={views} filterCounts={filterCounts} />
            </SectionCard>
          </div>

          <aside className={atlasAsideColumn}>
            <SectionCard
              tone="primary"
              title="Carica una polizza PDF"
              description="Atlas preparerà il documento per l'analisi AI."
              padding="md"
            >
              <DocumentUploadForm />
            </SectionCard>

            {recent.length > 0 ? (
              <SectionCard title="In evidenza" padding="sm">
                <ul className="space-y-3">
                  {recent.map((view) => (
                    <li key={view.document.id}>
                      <Link
                        href={`/documents/${view.document.id}`}
                        className="block rounded-lg border border-border-subtle bg-card-muted/30 p-2.5 transition hover:border-border hover:bg-card-muted/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-semibold text-foreground">
                              {view.document.fileName}
                            </span>
                            <span className="text-[10px] text-muted">
                              {formatDate(view.document.createdAt)} ·{" "}
                              {formatFileSize(view.document.fileSize)}
                            </span>
                          </span>
                          <DocumentStatusBadge status={view.document.status} />
                        </div>
                        <div className="mt-2">
                          <DocumentWorkflowStrip stage={view.workflowStage} compact />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </aside>
        </div>

        <div
          className={`${atlasCard.secondary} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                Archivio privato · dati reali
              </p>
              <p className="text-[12px] text-muted">
                Indicatori e riepiloghi derivano solo da PDF caricati e polizze collegate.
                Nessuna stima o insight inventato.
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="shrink-0 rounded-lg border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:bg-card-muted"
          >
            Impostazioni account
          </Link>
        </div>
      </RevealStagger>
    </PageShell>
  );
}
