import type { VerificationStatus } from "@/lib/insurance-os/verification";

export type PolicyChangeType =
  | "premium"
  | "deductible"
  | "limit"
  | "coverage_added"
  | "coverage_removed"
  | "exclusion_added"
  | "exclusion_removed"
  | "duration"
  | "insurer"
  | "insured_asset"
  | "insured_person"
  | "terms"
  | "other";

export type PolicyChangeEvent = {
  id: string;
  policyId: string;
  changeType: PolicyChangeType;
  fieldPath: string;
  previousValue: unknown;
  newValue: unknown;
  displaySummary: string;
  verificationStatus: VerificationStatus;
  sourceDocumentId: string | null;
  idempotencyKey: string;
  createdAt: string;
};
