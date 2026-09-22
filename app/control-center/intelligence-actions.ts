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
