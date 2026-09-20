"use server";

import { revalidatePath } from "next/cache";
import { requireOperationsRole } from "@/lib/operations-access";

const val = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const req = (formData: FormData, key: string) => {
  const result = val(formData, key);
  if (!result) throw new Error(`Campo ${key} obbligatorio.`);
  return result;
};

export async function assignConsultationAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { error } = await supabase.rpc("assign_consultation", {
    p_consultation_request_id: req(formData, "request_id"),
    p_broker_id: val(formData, "broker_id") || null,
    p_reason: val(formData, "reason") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createBrokerAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const authUserId = req(formData, "auth_user_id");
  const { error } = await supabase.from("brokers").insert({
    auth_user_id: authUserId,
    display_name: req(formData, "display_name"),
    legal_name: val(formData, "legal_name") || null,
    organization_name: val(formData, "organization_name") || null,
    email: val(formData, "email") || null,
    active: true,
  });
  if (error) throw new Error(error.message);
  const { error: roleError } = await supabase.rpc("set_user_role", { p_user_id: authUserId, p_role: "broker" });
  if (roleError) throw new Error(roleError.message);
  revalidatePath("/admin");
}

export async function createCommissionAgreementAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { error } = await supabase.from("commission_agreements").insert({
    broker_id: req(formData, "broker_id"),
    effective_from: req(formData, "effective_from"),
    effective_to: val(formData, "effective_to") || null,
    atlas_percentage: Number(req(formData, "atlas_percentage")),
    broker_percentage: Number(req(formData, "broker_percentage")),
    scope: val(formData, "scope") || "global",
    category: val(formData, "category") || null,
    insurer: val(formData, "insurer") || null,
    notes: val(formData, "notes") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createCommissionAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { error } = await supabase.rpc("create_commission_attribution", {
    p_consultation_request_id: req(formData, "request_id"),
    p_broker_contract_id: val(formData, "contract_id") || null,
    p_policy_id: val(formData, "policy_id") || null,
    p_parent_commission_id: val(formData, "parent_commission_id") || null,
    p_insurer: req(formData, "insurer"),
    p_product: val(formData, "product") || "",
    p_category: req(formData, "category"),
    p_commission_type: val(formData, "commission_type") || "acquisition",
    p_currency: "CHF",
    p_gross_commission: Number(req(formData, "gross_commission")),
    p_commission_rate: val(formData, "commission_rate") ? Number(val(formData, "commission_rate")) : null,
    p_earned_at: val(formData, "earned_at") ? new Date(val(formData, "earned_at")).toISOString() : null,
    p_status: val(formData, "status") || "expected",
    p_source: "manual",
    p_external_reference: val(formData, "external_reference") || "",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createCommissionAdjustmentAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { error } = await supabase.rpc("create_commission_adjustment", {
    p_commission_attribution_id: req(formData, "commission_id"),
    p_adjustment_type: req(formData, "adjustment_type"),
    p_amount: Number(req(formData, "amount")),
    p_reason: req(formData, "reason"),
    p_occurred_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
