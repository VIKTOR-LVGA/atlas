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
import { isTypedPolicyType } from "@/lib/policy-types";
import type {
  PolicyDetails,
  PolicyInput,
  PolicyPremiumFrequency,
  TypedPolicyType,
} from "@/lib/types";

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
    currency?: string;
    premiumAmount?: string;
    premiumFrequency?: string;
    deductible?: string;
    coverageAmount?: string;
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
    details?: string;
  };
};

export type DeletePolicyActionState = PolicyActionState;

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableAmount(
  formData: FormData,
  field:
    | "premium_amount"
    | "deductible"
    | "coverage_amount"
    | "detail_franchise"
    | "detail_health_deductible"
    | "detail_annual_km"
    | "detail_insured_sum"
    | "detail_liability_limit"
    | "detail_household_members_included",
  fieldErrors: NonNullable<PolicyActionState["fieldErrors"]>,
  errorKey: "premiumAmount" | "deductible" | "coverageAmount" | "details"
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

function hasCheckboxValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getNullableTextField(formData: FormData, name: string) {
  return getTextField(formData, name) || null;
}

function validateDateField(
  date: string,
  fieldErrors: NonNullable<PolicyActionState["fieldErrors"]>,
  errorKey: "startDate" | "endDate" | "renewalDate"
) {
  if (
    date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(new Date(`${date}T00:00:00Z`).getTime()))
  ) {
    fieldErrors[errorKey] = "Inserisci una data valida.";
  }
}

function getPolicyDetails(
  formData: FormData,
  policyType: TypedPolicyType,
  fieldErrors: NonNullable<PolicyActionState["fieldErrors"]>
): PolicyDetails {
  switch (policyType) {
    case "health":
      return {
        franchise: getNullableAmount(
          formData,
          "detail_franchise",
          fieldErrors,
          "details"
        ),
        deductible: getNullableAmount(
          formData,
          "detail_health_deductible",
          fieldErrors,
          "details"
        ),
        model: getNullableTextField(formData, "detail_model"),
        complementary: hasCheckboxValue(formData, "detail_complementary"),
        hospital_coverage: getNullableTextField(
          formData,
          "detail_hospital_coverage"
        ),
        accident_covered: hasCheckboxValue(formData, "detail_accident_covered"),
        telemedicine: hasCheckboxValue(formData, "detail_telemedicine"),
        family_doctor_model: hasCheckboxValue(
          formData,
          "detail_family_doctor_model"
        ),
      };
    case "car":
      return {
        plate_number: getNullableTextField(formData, "detail_plate_number"),
        casco: getNullableTextField(formData, "detail_casco"),
        bonus_malus: getNullableTextField(formData, "detail_bonus_malus"),
        annual_km: getNullableAmount(
          formData,
          "detail_annual_km",
          fieldErrors,
          "details"
        ),
      };
    case "household":
      return {
        insured_sum: getNullableAmount(
          formData,
          "detail_insured_sum",
          fieldErrors,
          "details"
        ),
        glass_coverage: hasCheckboxValue(formData, "detail_glass_coverage"),
        theft_coverage: hasCheckboxValue(formData, "detail_theft_coverage"),
      };
    case "liability":
      return {
        liability_limit: getNullableAmount(
          formData,
          "detail_liability_limit",
          fieldErrors,
          "details"
        ),
        household_members_included: getNullableAmount(
          formData,
          "detail_household_members_included",
          fieldErrors,
          "details"
        ),
      };
    case "legal":
      return {
        private_legal: hasCheckboxValue(formData, "detail_private_legal"),
        traffic_legal: hasCheckboxValue(formData, "detail_traffic_legal"),
        coverage_region: getNullableTextField(formData, "detail_coverage_region"),
      };
    default:
      return {
        generic_details: getNullableTextField(formData, "detail_generic_details"),
      };
  }
}

function getPolicyInput(formData: FormData) {
  const provider = getTextField(formData, "provider");
  const policyType = getTextField(formData, "policy_type");
  const currency = getTextField(formData, "currency") || "CHF";
  const premiumFrequency = getTextField(formData, "premium_frequency");
  const startDate = getTextField(formData, "start_date");
  const endDate = getTextField(formData, "end_date");
  const renewalDate = getTextField(formData, "renewal_date");
  const fieldErrors: NonNullable<PolicyActionState["fieldErrors"]> = {};

  if (!provider) {
    fieldErrors.provider = "Inserisci la compagnia.";
  }

  if (!isTypedPolicyType(policyType)) {
    fieldErrors.policyType = "Scegli un tipo di polizza valido.";
  }

  if (!currency) {
    fieldErrors.currency = "Inserisci la valuta.";
  }

  if (
    !policyPremiumFrequencies.includes(
      premiumFrequency as PolicyPremiumFrequency
    )
  ) {
    fieldErrors.premiumFrequency = "Scegli una frequenza valida.";
  }

  validateDateField(startDate, fieldErrors, "startDate");
  validateDateField(endDate, fieldErrors, "endDate");
  validateDateField(renewalDate, fieldErrors, "renewalDate");

  if (startDate && endDate && endDate < startDate) {
    fieldErrors.endDate = "La data fine precede la data inizio.";
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
  const coverageAmount = getNullableAmount(
    formData,
    "coverage_amount",
    fieldErrors,
    "coverageAmount"
  );
  const details = isTypedPolicyType(policyType)
    ? getPolicyDetails(formData, policyType, fieldErrors)
    : {};

  if (Object.keys(fieldErrors).length > 0) {
    return { input: null, fieldErrors };
  }

  const input: PolicyInput = {
    documentId: getTextField(formData, "document_id") || null,
    provider,
    policyType: policyType as TypedPolicyType,
    policyCategoryLabel: getNullableTextField(formData, "policy_category_label"),
    policyNumber: getNullableTextField(formData, "policy_number"),
    premiumAmount,
    premiumFrequency: premiumFrequency as PolicyPremiumFrequency,
    deductible,
    startDate: startDate || null,
    endDate: endDate || null,
    renewalDate: renewalDate || null,
    currency,
    coverageAmount,
    details,
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
