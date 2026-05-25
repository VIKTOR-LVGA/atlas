/** Optional support contact for account closure requests (no fake inbox). */
export function getAtlasSupportEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_ATLAS_SUPPORT_EMAIL?.trim();
  return email && email.includes("@") ? email : null;
}

export function buildAccountClosureMailtoUrl(input: {
  userEmail: string | null;
  userId: string;
}): string | null {
  const supportEmail = getAtlasSupportEmail();

  if (!supportEmail) {
    return null;
  }

  const subject = encodeURIComponent("Richiesta eliminazione profilo Atlas");
  const body = encodeURIComponent(
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

  return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
}
