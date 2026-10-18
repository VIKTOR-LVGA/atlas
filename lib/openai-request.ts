import "server-only";

const DEFAULT_EXTRACTION_TIMEOUT_MS = 90_000;
const DEFAULT_ASK_TIMEOUT_MS = 20_000;
const MIN_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 180_000;

function readTimeout(name: string, fallback: number) {
  const configured = Number(process.env[name]);

  if (!Number.isFinite(configured)) {
    return fallback;
  }

  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.round(configured)));
}

export function getOpenAIExtractionSignal() {
  return AbortSignal.timeout(
    readTimeout("OPENAI_POLICY_EXTRACTION_TIMEOUT_MS", DEFAULT_EXTRACTION_TIMEOUT_MS)
  );
}

export function getAskAtlasSignal() {
  return AbortSignal.timeout(
    readTimeout("OPENAI_ASK_ATLAS_TIMEOUT_MS", DEFAULT_ASK_TIMEOUT_MS)
  );
}

export function isOpenAITimeout(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
