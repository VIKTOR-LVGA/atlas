"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertBrokerPortalEnabled } from "@/lib/broker-portal";
import { OperationsInputError } from "@/lib/operations-errors";
import {
  submitPartnerApplication,
  type PartnerType,
} from "@/lib/partner-applications";

export type PartnerApplyState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function submitPartnerApplicationAction(
  _prev: PartnerApplyState,
  formData: FormData
): Promise<PartnerApplyState> {
  assertBrokerPortalEnabled();
  try {
    const consent = formData.get("consent") === "on";
    const termsAccepted = formData.get("terms") === "on";
    const accuracyDeclared = formData.get("accuracy_declared") === "on";
    const served = formData.getAll("served_cantons").map(String);
    const languages = formData.getAll("languages").map(String);
    await submitPartnerApplication({
      firstName: String(formData.get("first_name") ?? ""),
      lastName: String(formData.get("last_name") ?? ""),
      organizationName: String(formData.get("organization_name") ?? ""),
      legalName: String(formData.get("legal_name") ?? ""),
      professionalEmail: String(formData.get("professional_email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      partnerType: (String(formData.get("partner_type") ?? "independent_broker") ||
        "independent_broker") as PartnerType,
      primaryCanton: String(formData.get("primary_canton") ?? ""),
      servedCantons: served.length
        ? served
        : [String(formData.get("primary_canton") ?? "")].filter(Boolean),
      languages: languages.length ? languages : ["it"],
      professionalId: String(formData.get("professional_id") ?? ""),
      experienceNotes: String(formData.get("experience_notes") ?? ""),
      message: String(formData.get("message") ?? ""),
      consent,
      termsAccepted,
      accuracyDeclared,
    });
    revalidatePath("/partner/status");
    redirect("/partner/status");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return {
      status: "error",
      message:
        error instanceof OperationsInputError
          ? error.message
          : "Candidatura non inviata. Riprova.",
    };
  }
}
