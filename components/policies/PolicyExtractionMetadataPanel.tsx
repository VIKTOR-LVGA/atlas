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
      label: "Keyword",
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
      title="Dettagli tecnici estrazione"
      description="Metadati per revisione avanzata"
      badge={
        metadata.warnings?.length ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            {metadata.warnings.length} avvisi
          </span>
        ) : null
      }
    >
      <div className="space-y-3 text-[12px]">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="font-medium text-slate-700">{section.label}</p>
            <p className="mt-0.5 leading-relaxed text-slate-500">{section.value}</p>
          </div>
        ))}
        {metadata.warnings?.length ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3">
            <p className="font-medium text-amber-900">Avvisi interni</p>
            <ul className="mt-1 space-y-1 text-amber-800">
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
