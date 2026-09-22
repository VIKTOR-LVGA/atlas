"use server";

import { revalidatePath } from "next/cache";
import { requireOperationsRole } from "@/lib/operations-access";

export async function reviewIntelligenceApplicationAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const applicationId = String(formData.get("application_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const rejectionReason = String(formData.get("rejection_reason") ?? "") || null;

  const { error } = await supabase.rpc("review_intelligence_application", {
    p_application_id: applicationId,
    p_decision: decision,
    p_admin_notes: null,
    p_rejection_reason: rejectionReason,
    p_module_access: null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/control-center/intelligence");
}

export async function refreshIntelligenceSnapshotsAction() {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { error } = await supabase.rpc("refresh_intelligence_snapshots", {
    p_trigger_source: "manual",
    p_period_days: 365,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/control-center/intelligence");
  revalidatePath("/control-center/health");
  revalidatePath("/intelligence/dashboard");
}

export async function setIntelligenceCompanyStatusAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const companyId = String(formData.get("company_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!companyId || !["active", "suspended"].includes(status)) {
    throw new Error("invalid company status update");
  }
  const { error } = await supabase
    .from("intelligence_companies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", companyId);
  if (error) throw new Error(error.message);
  if (status === "suspended") {
    await supabase
      .from("intelligence_memberships")
      .update({ active: false })
      .eq("company_id", companyId);
  } else {
    await supabase
      .from("intelligence_memberships")
      .update({ active: true })
      .eq("company_id", companyId);
  }
  revalidatePath("/control-center/intelligence");
}
