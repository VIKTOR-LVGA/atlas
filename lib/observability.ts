/**
 * Privacy-safe operational diagnostics for ATLAS.
 *
 * Logs only technical event codes, route, digest and role. Never attach
 * document content, passwords, tokens, emails, policy numbers or payloads.
 */

import { createHash, randomBytes } from "crypto";

export type AtlasErrorRole = "consumer" | "broker" | "admin" | "public";

export type AtlasErrorEvent = {
  code: string;
  route?: string;
  digest?: string;
  role?: AtlasErrorRole;
};

const SENSITIVE_PATTERN =
  /password|token|authorization|cookie|email|phone|policy|document|iban|ssn|secret|key/i;

function sanitizeRoute(route: string | undefined) {
  if (!route) return undefined;
  return route.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "[id]"
  );
}

export function reportAtlasError(event: AtlasErrorEvent) {
  if (SENSITIVE_PATTERN.test(event.code)) {
    return;
  }

  const payload = {
    source: "atlas",
    code: event.code,
    route: sanitizeRoute(event.route),
    digest: event.digest,
    role: event.role,
    at: new Date().toISOString(),
  };

  console.error("[atlas:error]", payload);
}

/** Short public-facing error reference — never include stack or secrets. */
export function createErrorTraceId(prefix = "atl"): string {
  const stamp = Date.now().toString(36);
  const rand = randomBytes(4).toString("hex");
  return `${prefix}_${stamp}_${rand}`;
}

export function hashForLog(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function publicErrorMessage(traceId: string): string {
  return `Si è verificato un problema tecnico. Codice riferimento: ${traceId}`;
}

export function logServerError(
  scope: string,
  error: unknown,
  extras?: Record<string, unknown>
) {
  const traceId = createErrorTraceId();
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      traceId,
      message,
      ...extras,
      at: new Date().toISOString(),
    })
  );
  return traceId;
}
