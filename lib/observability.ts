/**
 * Privacy-safe operational diagnostics for ATLAS.
 *
 * Logs only technical event codes, route, digest and role. Never attach
 * document content, passwords, tokens, emails, policy numbers or payloads.
 */

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
