import type { ClaimCategory } from "@/lib/insurance-os/claims-client";

export type ClaimChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
};

export type InsuranceClaimView = {
  id: string;
  status: string;
  category: ClaimCategory;
  title: string;
  description: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  estimatedAmount: number | null;
  currency: string;
  peopleInvolved: string | null;
  notes: string | null;
  checklist: ClaimChecklistItem[];
  relatedPolicyIds: string[];
  matchingRationale: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type ClaimFileView = {
  id: string;
  claimId: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  kind: string;
  createdAt: string;
};
