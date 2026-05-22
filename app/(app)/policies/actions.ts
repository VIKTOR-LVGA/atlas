"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPolicy,
  deletePolicy,
  PolicyManagementError,
  updatePolicy,
} from "@/lib/policies";
import type { PolicyInput, PolicyPremiumFrequency } from "@/lib/types";

const policyPremiumFrequencies = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
] as const;

export type PolicyActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: {
    provider?: string;
    policyType?: string;
    premiumAmount?: string;
    premiumFrequency?: string;
    deductible?: string;
    renewalDate?: string;
  };
};

export type DeletePolicyActionState = PolicyActionState;

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableAmount(
  formData: FormData,
  field: "premium_amount" | "deductible",
  fieldErrors: NonNullable<PolicyActionState["fieldErrors"]>,
  errorKey: "premiumAmount" | "deductible"
) {
  const amount = getTextField(formData, field);

  if (!amount) {
    return null;
  }

  const number = Number(amount.replace(",", "."));

  if (!Number.isFinite(number) || number < 0) {
    fieldErrors[errorKey] = "Inserisci un importo valido.";
    return null;
  }

  return number;
}

function getPolicyInput(formData: FormData) {
  const provider = getTextField(formData, "provider");
  const policyType = getTextField(formData, "policy_type");
  const premiumFrequency = getTextField(formData, "premium_frequency");
  const renewalDate = getTextField(formData, "renewal_date");
  const fieldErrors: NonNullable<PolicyActionState["fieldErrors"]> = {};

  if (!provider) {
    fieldErrors.provider = "Inserisci la compagnia.";
  }

  if (!policyType) {
    fieldErrors.policyType = "Inserisci il tipo di polizza.";
  }

  if (
    !policyPremiumFrequencies.includes(
      premiumFrequency as PolicyPremiumFrequency
    )
  ) {
    fieldErrors.premiumFrequency = "Scegli una frequenza valida.";
  }

  if (
    renewalDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(renewalDate) ||
      !Number.isFinite(new Date(`${renewalDate}T00:00:00Z`).getTime()))
  ) {
    fieldErrors.renewalDate = "Inserisci una data valida.";
  }

  const premiumAmount = getNullableAmount(
    formData,
    "premium_amount",
    fieldErrors,
    "premiumAmount"
  );
  const deductible = getNullableAmount(
    formData,
    "deductible",
    fieldErrors,
    "deductible"
  );

  if (Object.keys(fieldErrors).length > 0) {
    return { input: null, fieldErrors };
  }

  const input: PolicyInput = {
    documentId: getTextField(formData, "document_id") || null,
    provider,
    policyType,
    premiumAmount,
    premiumFrequency: premiumFrequency as PolicyPremiumFrequency,
    deductible,
    renewalDate: renewalDate || null,
    notes: getTextField(formData, "notes") || null,
  };

  return { input, fieldErrors: undefined };
}

function getPolicyErrorState(error: unknown): PolicyActionState {
  return {
    status: "error",
    message:
      error instanceof PolicyManagementError
        ? error.message
        : "Operazione polizza non riuscita. Riprova tra poco.",
  };
}

function revalidatePolicyViews(id?: string, documentId?: string | null) {
  revalidatePath("/policies");
  revalidatePath("/dashboard");

  if (id) {
    revalidatePath(`/policies/${id}`);
  }

  if (documentId) {
    revalidatePath(`/documents/${documentId}`);
  }
}

export async function createPolicyAction(
  _previousState: PolicyActionState,
  formData: FormData
): Promise<PolicyActionState> {
  const { input, fieldErrors } = getPolicyInput(formData);

  if (!input) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors,
    };
  }

  let policyId: string;

  try {
    const policy = await createPolicy(input);
    policyId = policy.id;
    revalidatePolicyViews(policy.id, policy.documentId);
  } catch (error) {
    return getPolicyErrorState(error);
  }

  redirect(`/policies/${policyId}`);
}

export async function updatePolicyAction(
  id: string,
  _previousState: PolicyActionState,
  formData: FormData
): Promise<PolicyActionState> {
  const { input, fieldErrors } = getPolicyInput(formData);

  if (!input) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors,
    };
  }

  try {
    const policy = await updatePolicy(id, input);

    if (!policy) {
      return {
        status: "error",
        message: "Polizza non trovata.",
      };
    }

    revalidatePolicyViews(policy.id, policy.documentId);
  } catch (error) {
    return getPolicyErrorState(error);
  }

  redirect(`/policies/${id}`);
}

export async function deletePolicyAction(
  id: string,
  redirectToPolicies: boolean,
  _previousState: DeletePolicyActionState,
  formData: FormData
): Promise<DeletePolicyActionState> {
  void formData;

  try {
    const deleted = await deletePolicy(id);

    if (!deleted) {
      return {
        status: "error",
        message: "Polizza non trovata.",
      };
    }

    revalidatePolicyViews(id);
  } catch (error) {
    return getPolicyErrorState(error);
  }

  if (redirectToPolicies) {
    redirect("/policies");
  }

  return {
    status: "idle",
    message: "",
  };
}
