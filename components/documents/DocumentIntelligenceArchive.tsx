"use client";

import { useMemo, useState } from "react";
import { DocumentFilterBar } from "@/components/documents/DocumentFilterBar";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentsArchiveEmpty } from "@/components/documents/DocumentsArchiveEmpty";
import {
  documentMatchesFilter,
  type DocumentFilterId,
  type DocumentIntelligenceView,
} from "@/lib/document-intelligence";

type DocumentIntelligenceArchiveProps = {
  views: DocumentIntelligenceView[];
  filterCounts: Record<DocumentFilterId, number>;
};

export function DocumentIntelligenceArchive({
  views,
  filterCounts,
}: DocumentIntelligenceArchiveProps) {
  const [activeFilter, setActiveFilter] = useState<DocumentFilterId>("all");
  const [query, setQuery] = useState("");

  const filteredViews = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return views.filter((view) => {
      if (!documentMatchesFilter(view, activeFilter)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const haystack = [
        view.document.fileName,
        view.linkedPolicy?.provider,
        view.linkedPolicy?.policyNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [views, activeFilter, query]);

  if (views.length === 0) {
    return <DocumentsArchiveEmpty />;
  }

  return (
    <>
      <DocumentFilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        query={query}
        onQueryChange={setQuery}
        filterCounts={filterCounts}
      />
      {filteredViews.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-6">
          <p className="text-[13px] font-semibold text-foreground">
            Nessun documento per questo filtro
          </p>
          <p className="mt-1 text-[12px] text-muted">
            Prova un altro filtro o modifica la ricerca.
          </p>
        </div>
      ) : (
        <DocumentList views={filteredViews} />
      )}
    </>
  );
}
