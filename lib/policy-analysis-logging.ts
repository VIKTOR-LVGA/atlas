import "server-only";

// Do not send document content, extracted fields, user IDs or provider errors to runtime logs.
const LOG_PREFIX = "[insura:policy-analysis]";
type LogValue = string | number | boolean | null | undefined;
type LogDetails = Record<string, LogValue>;
const SAFE_NUMERIC_KEYS = new Set(["durationMs", "pages", "pageCount", "fileSize", "textLength", "tokenCount", "inputTokens", "outputTokens", "estimatedCostChf"]);
const SAFE_BOOLEAN_KEYS = new Set(["success", "retryable", "hasText", "hasEvidence"]);
const SAFE_CODES = /^[a-z][a-z0-9_-]{0,63}$/;

function safeDetails(details: LogDetails) {
  const clean: Record<string, number | boolean> = {};
  for (const [key, value] of Object.entries(details)) {
    if (SAFE_NUMERIC_KEYS.has(key) && typeof value === "number" && Number.isFinite(value)) clean[key] = value;
    if (SAFE_BOOLEAN_KEYS.has(key) && typeof value === "boolean") clean[key] = value;
  }
  return clean;
}
function safeEvent(event: string) { return SAFE_CODES.test(event) ? event : "unspecified_event"; }
export function getTextPreview(_value: string) { return "[REDACTED]"; }
export function getInternalFailureReason(value: string) {
  // Persist a generic diagnostic category, never raw upstream errors or policy text.
  const normalized = value.toLowerCase();
  if (normalized.includes("timeout")) return "timeout";
  if (normalized.includes("rate limit") || normalized.includes("429")) return "rate_limited";
  if (normalized.includes("pdf")) return "pdf_processing_failed";
  if (normalized.includes("storage")) return "storage_failed";
  return "analysis_failed";
}
export function logPolicyAnalysisInfo(event: string, details: LogDetails = {}) {
  console.info(LOG_PREFIX, safeEvent(event), safeDetails(details));
}
export function logPolicyAnalysisError(event: string, details: LogDetails = {}) {
  console.error(LOG_PREFIX, safeEvent(event), safeDetails(details));
}
