import "server-only";

const LOG_PREFIX = "[atlas:policy-analysis]";
const MAX_TEXT_PREVIEW_LENGTH = 500;
const MAX_INTERNAL_REASON_LENGTH = 1200;

type LogValue = string | number | boolean | null | undefined;
type LogDetails = Record<string, LogValue>;

function cleanLogString(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanLogDetails(details: LogDetails) {
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      typeof value === "string"
        ? cleanLogString(
            value,
            key.toLowerCase().includes("preview")
              ? MAX_TEXT_PREVIEW_LENGTH
              : MAX_INTERNAL_REASON_LENGTH
          )
        : value,
    ])
  );
}

export function getTextPreview(value: string) {
  return cleanLogString(value, MAX_TEXT_PREVIEW_LENGTH);
}

export function getInternalFailureReason(value: string) {
  return cleanLogString(value, MAX_INTERNAL_REASON_LENGTH);
}

export function logPolicyAnalysisInfo(event: string, details: LogDetails = {}) {
  console.info(LOG_PREFIX, event, cleanLogDetails(details));
}

export function logPolicyAnalysisError(event: string, details: LogDetails = {}) {
  console.error(LOG_PREFIX, event, cleanLogDetails(details));
}
