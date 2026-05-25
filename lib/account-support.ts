/** Optional support contact for account closure requests (no fake inbox). */
export function getAtlasSupportEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_ATLAS_SUPPORT_EMAIL?.trim();
  return email && email.includes("@") ? email : null;
}

/**
 * Dev-only fallback when NEXT_PUBLIC_ATLAS_SUPPORT_EMAIL is unset.
 * Set NEXT_PUBLIC_ATLAS_DEV_SUPPORT_EMAIL in .env.local (never commit secrets).
 */
function getDevelopmentSupportEmail(): string | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const devEmail = process.env.NEXT_PUBLIC_ATLAS_DEV_SUPPORT_EMAIL?.trim();
  return devEmail && devEmail.includes("@") ? devEmail : null;
}

export function getProfileDeletionSupportEmail(): string | null {
  return getAtlasSupportEmail() ?? getDevelopmentSupportEmail();
}

function buildClosureMailtoBody(input: {
  userEmail: string | null;
  userId: string;
}) {
  return encodeURIComponent(
    [
      "Buongiorno,",
      "",
      "Desidero eliminare il mio profilo Atlas e l'accesso associato.",
      "",
      `Email: ${input.userEmail ?? "—"}`,
      `Riferimento account: ${input.userId}`,
      "",
      "Grazie.",
    ].join("\n")
  );
}

const CLOSURE_SUBJECT = encodeURIComponent("Richiesta eliminazione profilo Atlas");

export type ProfileDeletionRequest =
  | { kind: "mailto"; url: string; sendsToSupport: boolean }
  | { kind: "modal" };

export function resolveProfileDeletionRequest(input: {
  userEmail: string | null;
  userId: string;
}): ProfileDeletionRequest {
  const supportEmail = getProfileDeletionSupportEmail();
  const body = buildClosureMailtoBody(input);

  if (supportEmail) {
    return {
      kind: "mailto",
      sendsToSupport: true,
      url: `mailto:${supportEmail}?subject=${CLOSURE_SUBJECT}&body=${body}`,
    };
  }

  if (input.userEmail) {
    return {
      kind: "mailto",
      sendsToSupport: false,
      url: `mailto:${input.userEmail}?subject=${CLOSURE_SUBJECT}&body=${body}`,
    };
  }

  return { kind: "modal" };
}

/** @deprecated Use resolveProfileDeletionRequest */
export function buildAccountClosureMailtoUrl(input: {
  userEmail: string | null;
  userId: string;
}): string | null {
  const resolved = resolveProfileDeletionRequest(input);
  return resolved.kind === "mailto" ? resolved.url : null;
}
