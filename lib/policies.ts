import "server-only";

import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PolicyInput,
  PolicyPremiumFrequency,
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
  "id, user_id, document_id, provider, policy_type, premium_amount, premium_frequency, deductible, renewal_date, notes, status, created_at, updated_at";

type PolicyRow = {
  id: string;
  user_id: string;
  document_id: string | null;
  provider: string;
  policy_type: string;
  premium_amount: number | string | null;
  premium_frequency: string | null;
  deductible: number | string | null;
  renewal_date: string | null;
  notes: string | null;
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

function toUserPolicy(
  policy: PolicyRow,
  documents: Map<string, UserPolicyDocument>
): UserPolicy {
  return {
    id: policy.id,
    userId: policy.user_id,
    documentId: policy.document_id,
    document: policy.document_id ? documents.get(policy.document_id) ?? null : null,
    provider: policy.provider,
    policyType: policy.policy_type,
    premiumAmount: toNullableNumber(policy.premium_amount),
    premiumFrequency: toPolicyPremiumFrequency(policy.premium_frequency),
    deductible: toNullableNumber(policy.deductible),
    renewalDate: policy.renewal_date,
    notes: policy.notes,
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

function normalizePolicyInput(input: PolicyInput): PolicyInput {
  const provider = input.provider.trim();
  const policyType = input.policyType.trim();
  const notes = input.notes?.trim() || null;

  if (!provider) {
    throw new PolicyManagementError("Inserisci la compagnia assicurativa.");
  }

  if (!policyType) {
    throw new PolicyManagementError("Inserisci il tipo di polizza.");
  }

  if (!policyPremiumFrequencies.includes(input.premiumFrequency)) {
    throw new PolicyManagementError("Scegli una frequenza premio valida.");
  }

  assertNullableAmount(input.premiumAmount, "Premio");
  assertNullableAmount(input.deductible, "Franchigia");

  if (
    input.renewalDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.renewalDate) ||
      !Number.isFinite(new Date(`${input.renewalDate}T00:00:00Z`).getTime()))
  ) {
    throw new PolicyManagementError("Data rinnovo non valida.");
  }

  return {
    ...input,
    documentId: input.documentId?.trim() || null,
    provider,
    policyType,
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

export async function createPolicy(input: PolicyInput): Promise<UserPolicy> {
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
      premium_amount: policyInput.premiumAmount,
      premium_frequency: policyInput.premiumFrequency,
      deductible: policyInput.deductible,
      renewal_date: policyInput.renewalDate,
      notes: policyInput.notes,
    })
    .select(policySelect)
    .single();

  if (error || !data) {
    throw new PolicyManagementError("Creazione polizza non riuscita.");
  }

  const documents = await getPolicyDocuments(supabase, user.id, [documentId]);

  return toUserPolicy(data as PolicyRow, documents);
}

export async function updatePolicy(id: string, input: PolicyInput) {
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
      premium_amount: policyInput.premiumAmount,
      premium_frequency: policyInput.premiumFrequency,
      deductible: policyInput.deductible,
      renewal_date: policyInput.renewalDate,
      notes: policyInput.notes,
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
