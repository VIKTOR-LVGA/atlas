import { AlertCircle } from "lucide-react";
import { UNREADABLE_PDF_USER_MESSAGE } from "@/lib/extraction-messages";
import { friendlyInsuranceDocumentTypeLabel } from "@/lib/insurance-knowledge";

type DocumentAnalysisFailureBannerProps = {
  analysisError?: string | null;
};

function getDisplayMessage(analysisError?: string | null) {
  if (!analysisError?.trim()) {
    return "Non siamo riusciti a identificare con certezza tutti i dati della polizza. Puoi riprovare o creare la polizza manualmente.";
  }

  const trimmed = analysisError.trim();
  const nonPolicyMatch = trimmed.match(/non_policy_document:([a-z_]+)/i);
  if (
    nonPolicyMatch ||
    /classificat[oa].*general_conditions|Documento classificato come|sembra una/i.test(
      trimmed
    )
  ) {
    if (trimmed.includes("Non siamo riusciti") && trimmed.length < 400) {
      return trimmed;
    }
    const type = nonPolicyMatch?.[1];
    const label = friendlyInsuranceDocumentTypeLabel(type);
    return `Non siamo riusciti a identificare con certezza tutti i dati della polizza. Il documento sembra una «${label}». Puoi riprovare l'analisi, creare la polizza manualmente o segnalare una classificazione errata.`;
  }

  const looksUnreadable =
    /testo leggibile|illeggibile|pdf non|unreadable|poor quality|insufficient/i.test(
      trimmed
    );
  const looksTechnical =
    /OPENAI|API_KEY|stack|ECONN|timeout|undefined|PdfText|Error:/i.test(trimmed);

  if (looksUnreadable) {
    return UNREADABLE_PDF_USER_MESSAGE;
  }

  if (looksTechnical || trimmed.length > 220) {
    return "Non siamo riusciti a identificare con certezza tutti i dati della polizza. Puoi riprovare o creare la polizza manualmente.";
  }

  return trimmed;
}

export function DocumentAnalysisFailureBanner({
  analysisError,
}: DocumentAnalysisFailureBannerProps) {
  return (
    <div
      role="alert"
      className="atlas-alert-danger flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-3"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="atlas-alert-danger-title text-[13px]">Analisi incompleta</p>
        <p className="atlas-alert-danger-body mt-0.5 text-[12px] leading-relaxed">
          {getDisplayMessage(analysisError)}
        </p>
      </div>
    </div>
  );
}
