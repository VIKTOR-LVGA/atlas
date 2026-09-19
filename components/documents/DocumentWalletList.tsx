import Link from "next/link";
import {
  documentWalletCategoryLabels,
  inferDocumentWalletCategory,
  type DocumentWalletCategory,
} from "@/lib/document-wallet";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { UserDocument, UserPolicy } from "@/lib/types";

export function DocumentWalletList({
  documents,
  policiesByDocumentId,
}: {
  documents: UserDocument[];
  policiesByDocumentId: Map<string, UserPolicy>;
}) {
  const grouped = new Map<DocumentWalletCategory, UserDocument[]>();

  for (const document of documents) {
    const category = inferDocumentWalletCategory(
      document,
      policiesByDocumentId.get(document.id) ?? null
    );
    const list = grouped.get(category) ?? [];
    list.push(document);
    grouped.set(category, list);
  }

  const categories = Object.keys(documentWalletCategoryLabels) as DocumentWalletCategory[];

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const items = grouped.get(category);
        if (!items?.length) {
          return null;
        }

        return (
          <section key={category}>
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              {documentWalletCategoryLabels[category]}
            </h2>
            <ul className="atlas-consumer-card divide-y divide-border-subtle overflow-hidden">
              {items.map((document) => {
                const policy = policiesByDocumentId.get(document.id) ?? null;
                return (
                  <li key={document.id}>
                    <Link
                      href={`/documents/${document.id}`}
                      className="atlas-consumer-press flex min-h-16 items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium text-foreground">
                          {document.fileName}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-muted">
                          {policy ? policy.provider : "Non associato"}
                          {" · "}
                          {formatDate(document.createdAt)}
                          {" · "}
                          {formatFileSize(document.fileSize)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] font-medium text-accent">Apri</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
