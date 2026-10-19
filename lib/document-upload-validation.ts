/** Pure shared validation for private browser-to-Storage upload paths. */
const UUID_PDF = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

export function isOwnedDirectPdfPath(path: string, userId: string): boolean {
  if (!userId || !path.startsWith(userId + "/")) return false;
  return UUID_PDF.test(path.slice(userId.length + 1));
}

export function normalizeUploadedPdfName(input: string): string | null {
  const sanitized = input
    .replace(/[\\/\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!/\.pdf$/i.test(sanitized)) return null;
  if (sanitized.length <= 180) return sanitized;
  return sanitized.slice(0, 176) + ".pdf";
}
