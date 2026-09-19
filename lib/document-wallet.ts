import type { UserDocument, UserPolicy } from "@/lib/types";

export type DocumentWalletCategory =
  | "policy"
  | "terms"
  | "invoice"
  | "letter"
  | "claim"
  | "other";

export const documentWalletCategoryLabels: Record<DocumentWalletCategory, string> = {
  policy: "Polizze",
  terms: "Condizioni contrattuali",
  invoice: "Fatture",
  letter: "Comunicazioni",
  claim: "Sinistri",
  other: "Altro",
};

export function inferDocumentWalletCategory(
  document: UserDocument,
  linkedPolicy: UserPolicy | null
): DocumentWalletCategory {
  const haystack = document.fileName.toLowerCase();

  if (/fattur|invoice|premio\b|pagamento/.test(haystack)) {
    return "invoice";
  }

  if (/condizion|avb\b|cga\b|terms|regolamento/.test(haystack)) {
    return "terms";
  }

  if (/sinistr|claim|danno/.test(haystack)) {
    return "claim";
  }

  if (/lettera|comunicaz|mail|corrisponden/.test(haystack)) {
    return "letter";
  }

  if (linkedPolicy) {
    return "policy";
  }

  return "other";
}

export function getPoliciesByDocumentId(policies: UserPolicy[]) {
  const map = new Map<string, UserPolicy>();

  for (const policy of policies) {
    if (policy.documentId) {
      map.set(policy.documentId, policy);
    }
  }

  return map;
}
