import "server-only";

import { cache } from "react";
import {
  isTypedPolicyType,
  sanitizePolicyDetails,
  toTypedPolicyType,
} from "@/lib/policy-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PolicyCreationMetadata,
  PolicyInput,
  PolicyPremiumFrequency,
  PolicySource,
  UserPolicy,
  UserPolicyDocument,
} from "@/lib/types";

const policyPremiumFrequencies = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
] as const;

const policySelect =
  "id, user_id, document_id, provider, policy_type, policy_category_label, policy_number, premium_amount, premium_frequency, deductible, start_date, end_date, renewal_date, currency, coverage_amount, details, notes, extraction_confidence, extraction_notes, source, requires_review, status, created_at, updated_at";

type PolicyRow = {
  id: string;
  user_id: string;
  document_id: string | null;
  provider: string;
  policy_type: string;
  policy_category_label: string | null;
  policy_number: string | null;
  premium_amount: number | string | null;
  premium_frequency: string | null;
  deductible: number | string | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  currency: string | null;
  coverage_amount: number | string | null;
  details: unknown;
  notes: string | null;
  extraction_confidence: number | string | null;
  extraction_notes: string | null;
  source: string | null;
  requires_review: boolean | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export class PolicyManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyManagementError";
  }
}

function toNullableNumber(value: number | string | null) {
  if (value === null) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function toPolicyPremiumFrequency(value: string | null): PolicyPremiumFrequency {
  return policyPremiumFrequencies.includes(value as PolicyPremiumFrequency)
    ? (value as PolicyPremiumFrequency)
    : "monthly";
}

function toPolicySource(value: string | null): PolicySource {
  return value === "ai_draft" ? value : "manual";
}

function toUserPolicy(
  policy: PolicyRow,
  documents: Map<string, UserPolicyDocument>
): UserPolicy {
  const policyType = toTypedPolicyType(policy.policy_type);

  return {
    id: policy.id,
    userId: policy.user_id,
    documentId: policy.document_id,
    document: policy.document_id ? documents.get(policy.document_id) ?? null : null,
    provider: policy.provider,
    policyType,
    policyCategoryLabel:
      policy.policy_category_label ??
      (!isTypedPolicyType(policy.policy_type) && policyType === "other"
        ? policy.policy_type
        : null),
    policyNumber: policy.policy_number,
    premiumAmount: toNullableNumber(policy.premium_amount),
    premiumFrequency: toPolicyPremiumFrequency(policy.premium_frequency),
    deductible: toNullableNumber(policy.deductible),
    startDate: policy.start_date,
    endDate: policy.end_date,
    renewalDate: policy.renewal_date,
    currency: policy.currency?.trim() || "CHF",
    coverageAmount: toNullableNumber(policy.coverage_amount),
    details: sanitizePolicyDetails(policyType, policy.details),
    notes: policy.notes,
    extractionConfidence: toNullableNumber(policy.extraction_confidence),
    extractionNotes: policy.extraction_notes,
    source: toPolicySource(policy.source),
    requiresReview: policy.requires_review ?? false,
    status: policy.status ?? "active",
    createdAt: policy.created_at,
    updatedAt: policy.updated_at,
  };
}

function assertNullableAmount(value: number | null, fieldName: string) {
  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    throw new PolicyManagementError(`${fieldName} non valido.`);
  }
}

function assertNullableDate(value: string | null, fieldName: string) {
  if (
    value &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(new Date(`${value}T00:00:00Z`).getTime()))
  ) {
    throw new PolicyManagementError(`${fieldName} non valida.`);
  }
}

function normalizePolicyInput(input: PolicyInput): PolicyInput {
  const provider = input.provider.trim();
  const policyCategoryLabel = input.policyCategoryLabel?.trim() || null;
  const policyNumber = input.policyNumber?.trim() || null;
  const currency = input.currency.trim().toUpperCase();
  const notes = input.notes?.trim() || null;

  if (!provider) {
    throw new PolicyManagementError("Inserisci la compagnia assicurativa.");
  }

  if (!isTypedPolicyType(input.policyType)) {
    throw new PolicyManagementError("Scegli un tipo di polizza valido.");
  }

  if (!currency) {
    throw new PolicyManagementError("Inserisci la valuta della polizza.");
  }

  if (!policyPremiumFrequencies.includes(input.premiumFrequency)) {
    throw new PolicyManagementError("Scegli una frequenza premio valida.");
  }

  assertNullableAmount(input.premiumAmount, "Premio");
  assertNullableAmount(input.deductible, "Franchigia");
  assertNullableAmount(input.coverageAmount, "Somma copertura");

  assertNullableDate(input.startDate, "Data inizio");
  assertNullableDate(input.endDate, "Data fine");
  assertNullableDate(input.renewalDate, "Data rinnovo");

  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    throw new PolicyManagementError("La data fine precede la data inizio.");
  }

  return {
    ...input,
    documentId: input.documentId?.trim() || null,
    provider,
    policyCategoryLabel,
    policyNumber,
    currency,
    details: sanitizePolicyDetails(input.policyType, input.details),
    notes,
  };
}

async function getPolicyUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

async function getPolicyDocuments(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  documentIds: Array<string | null>
) {
  const uniqueDocumentIds = [...new Set(documentIds.filter((id): id is string => Boolean(id)))];

  if (uniqueDocumentIds.length === 0) {
    return new Map<string, UserPolicyDocument>();
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name")
    .eq("user_id", userId)
    .in("id", uniqueDocumentIds);

  if (error || !data) {
    return new Map<string, UserPolicyDocument>();
  }

  return new Map(
    data.map((document) => [
      document.id,
      { id: document.id, fileName: document.file_name },
    ])
  );
}

async function assertOwnedDocument(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  documentId: string | null
) {
  if (!documentId) {
    return null;
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new PolicyManagementError("Documento collegato non disponibile.");
  }

  return data.id;
}

export const getCurrentUserPolicies = cache(async (): Promise<UserPolicy[]> => {
  const { supabase, user } = await getPolicyUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("policies")
    .select(policySelect)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const policies = data as PolicyRow[];
  const documents = await getPolicyDocuments(
    supabase,
    user.id,
    policies.map((policy) => policy.document_id)
  );

  return policies.map((policy) => toUserPolicy(policy, documents));
});

export const getCurrentUserPolicyById = cache(
  async (id: string): Promise<UserPolicy | null> => {
    const { supabase, user } = await getPolicyUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("policies")
      .select(policySelect)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const policy = data as PolicyRow;
    const documents = await getPolicyDocuments(supabase, user.id, [
      policy.document_id,
    ]);

    return toUserPolicy(policy, documents);
  }
);

export async function createPolicy(
  input: PolicyInput,
  metadata: PolicyCreationMetadata = {}
): Promise<UserPolicy> {
  const policyInput = normalizePolicyInput(input);
  const { supabase, user } = await getPolicyUser();

  if (!user) {
    throw new PolicyManagementError("Accedi di nuovo per creare la polizza.");
  }

  const documentId = await assertOwnedDocument(
    supabase,
    user.id,
    policyInput.documentId
  );
  const { data, error } = await supabase
    .from("policies")
    .insert({
      user_id: user.id,
      document_id: documentId,
      provider: policyInput.provider,
      policy_type: policyInput.policyType,
      policy_category_label: policyInput.policyCategoryLabel,
      policy_number: policyInput.policyNumber,
      premium_amount: policyInput.premiumAmount,
      premium_frequency: policyInput.premiumFrequency,
      deductible: policyInput.deductible,
      start_date: policyInput.startDate,
      end_date: policyInput.endDate,
      renewal_date: policyInput.renewalDate,
      currency: policyInput.currency,
      coverage_amount: policyInput.coverageAmount,
      details: policyInput.details,
      notes: policyInput.notes,
      extraction_confidence: metadata.extractionConfidence ?? null,
      extraction_notes: metadata.extractionNotes ?? null,
      source: metadata.source ?? "manual",
      requires_review: metadata.requiresReview ?? false,
    })
    .select(policySelect)
    .single();

  if (error || !data) {
    throw new PolicyManagementError("Creazione polizza non riuscita.");
  }

  const documents = await getPolicyDocuments(supabase, user.id, [documentId]);

  return toUserPolicy(data as PolicyRow, documents);
}

export async function updatePolicy(
  id: string,
  input: PolicyInput,
  options?: { requiresReview?: boolean }
) {
  const policyInput = normalizePolicyInput(input);
  const { supabase, user } = await getPolicyUser();

  if (!user) {
    throw new PolicyManagementError("Accedi di nuovo per aggiornare la polizza.");
  }

  const documentId = await assertOwnedDocument(
    supabase,
    user.id,
    policyInput.documentId
  );
  const { data, error } = await supabase
    .from("policies")
    .update({
      document_id: documentId,
      provider: policyInput.provider,
      policy_type: policyInput.policyType,
      policy_category_label: policyInput.policyCategoryLabel,
      policy_number: policyInput.policyNumber,
      premium_amount: policyInput.premiumAmount,
      premium_frequency: policyInput.premiumFrequency,
      deductible: policyInput.deductible,
      start_date: policyInput.startDate,
      end_date: policyInput.endDate,
      renewal_date: policyInput.renewalDate,
      currency: policyInput.currency,
      coverage_amount: policyInput.coverageAmount,
      details: policyInput.details,
      notes: policyInput.notes,
      requires_review: options?.requiresReview ?? false,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(policySelect)
    .maybeSingle();

  if (error) {
    throw new PolicyManagementError("Aggiornamento polizza non riuscito.");
  }

  if (!data) {
    return null;
  }

  const documents = await getPolicyDocuments(supabase, user.id, [documentId]);

  return toUserPolicy(data as PolicyRow, documents);
}

export async function confirmPolicyReview(policyId: string): Promise<UserPolicy | null> {
  const { supabase, user } = await getPolicyUser();

  if (!user) {
    throw new PolicyManagementError("Accedi di nuovo per confermare la polizza.");
  }

  const existing = await getCurrentUserPolicyById(policyId);

  if (!existing) {
    return null;
  }

  if (!existing.requiresReview) {
    return existing;
  }

  const reviewedAt = new Date().toISOString();
  const details = sanitizePolicyDetails(existing.policyType, {
    ...existing.details,
    reviewed_at: reviewedAt,
  });

  const { data, error } = await supabase
    .from("policies")
    .update({
      requires_review: false,
      details,
    })
    .eq("id", policyId)
    .eq("user_id", user.id)
    .select(policySelect)
    .maybeSingle();

  if (error) {
    throw new PolicyManagementError("Conferma polizza non riuscita.");
  }

  if (!data) {
    return null;
  }

  const policy = data as PolicyRow;
  const documents = await getPolicyDocuments(supabase, user.id, [
    policy.document_id,
  ]);

  return toUserPolicy(policy, documents);
}

export async function updatePolicyDetails(
  id: string,
  details: PolicyInput["details"]
): Promise<UserPolicy | null> {
  const { supabase, user } = await getPolicyUser();

  if (!user) {
    throw new PolicyManagementError("Accedi di nuovo per aggiornare la polizza.");
  }

  const existing = await getCurrentUserPolicyById(id);

  if (!existing) {
    return null;
  }

  const sanitizedDetails = sanitizePolicyDetails(
    existing.policyType,
    details
  );

  const { data, error } = await supabase
    .from("policies")
    .update({
      details: sanitizedDetails,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(policySelect)
    .maybeSingle();

  if (error) {
    throw new PolicyManagementError("Aggiornamento coperture non riuscito.");
  }

  if (!data) {
    return null;
  }

  const policy = data as PolicyRow;
  const documents = await getPolicyDocuments(supabase, user.id, [
    policy.document_id,
  ]);

  return toUserPolicy(policy, documents);
}

export async function deletePolicy(id: string) {
  const { supabase, user } = await getPolicyUser();

  if (!user) {
    throw new PolicyManagementError("Accedi di nuovo per eliminare la polizza.");
  }

  const { data, error } = await supabase
    .from("policies")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new PolicyManagementError("Eliminazione polizza non riuscita.");
  }

  return Boolean(data);
}
