"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitIntelligenceApplicationAction(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fintelligence%2Fapply");

  if (!formData.get("consent")) {
    throw new Error("Consenso obbligatorio.");
  }

  const { error } = await supabase.from("intelligence_applications").insert({
    user_id: user.id,
    first_name: value(formData, "first_name"),
    last_name: value(formData, "last_name"),
    work_email: value(formData, "work_email"),
    company_name: value(formData, "company_name"),
    legal_entity: value(formData, "legal_entity") || null,
    job_title: value(formData, "job_title") || null,
    company_type: value(formData, "company_type") || "insurer",
    website: value(formData, "website") || null,
    country: "CH",
    market_scope: ["CH"],
    access_reason: value(formData, "access_reason"),
    desired_modules: [
      "market_overview",
      "switching",
      "premium_benchmark",
      "coverage_benchmark",
      "geography",
      "insurer_comparison",
    ],
    status: "submitted",
    consent_given_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/intelligence/status");
  redirect("/intelligence/status");
}
