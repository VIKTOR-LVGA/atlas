/** Italian count labels: use full singular/plural words, never append "e"/"i" to singular stems. */

export function italianCount(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function italianCountLabel(
  count: number,
  singular: string,
  plural: string,
  prefix = ""
): string {
  const core = italianCount(count, singular, plural);
  return prefix ? `${prefix}${core}` : core;
}
