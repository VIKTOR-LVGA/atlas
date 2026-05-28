import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import type { PolicyExtractionMetadata } from "@/lib/types";

export function PolicyExtractionMetadataPanel({
  metadata,
}: {
  metadata: PolicyExtractionMetadata;
}) {
  const hasContent =
    Boolean(metadata.matched_keywords?.length) ||
    Boolean(metadata.inferred_sections?.length) ||
    Boolean(metadata.warnings?.length) ||
    Boolean(metadata.provider_aliases_matched?.length) ||
    Boolean(metadata.detected_languages?.length) ||
    Boolean(metadata.source_hints?.length);

  if (!hasContent) {
    return null;
  }

  const sections = [
    {
      label: "Parole chiave",
      value: metadata.matched_keywords?.join(", "),
    },
    {
      label: "Sezioni inferite",
      value: metadata.inferred_sections?.join(", "),
    },
    {
      label: "Alias compagnia",
      value: metadata.provider_aliases_matched?.join(", "),
    },
    {
      label: "Lingue",
      value: metadata.detected_languages?.join(", ")?.toUpperCase(),
    },
    {
      label: "Sorgente",
      value: metadata.source_hints?.join(" · "),
    },
  ].filter((section) => Boolean(section.value));

  return (
    <CollapsibleSection
      title="Dettagli estrazione"
      description="Informazioni aggiuntive per la revisione"
      badge={
        metadata.warnings?.length ? (
          <span className="rounded-full bg-[var(--warning-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--warning-text)]">
            {metadata.warnings.length} avvisi
          </span>
        ) : null
      }
    >
      <div className="space-y-3 text-[12px]">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="font-medium text-muted-foreground">{section.label}</p>
            <p className="mt-0.5 leading-relaxed text-muted">{section.value}</p>
          </div>
        ))}
        {metadata.warnings?.length ? (
          <div className="atlas-alert-warning p-3">
            <p className="atlas-alert-warning-title text-[12px]">Avvertenze</p>
            <ul className="atlas-alert-warning-body mt-1 space-y-1 text-[11px]">
              {metadata.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}
