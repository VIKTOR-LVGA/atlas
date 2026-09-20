"use server";

import { revalidatePath } from "next/cache";
import { OperationsInputError } from "@/lib/operations-errors";
import { requireOperationsRole } from "@/lib/operations-access";
import { reviewPartnerApplication } from "@/lib/partner-applications";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fieldLabels: Record<string, string> = {
  auth_user_id: "Account ATLAS del broker",
  display_name: "Nome visualizzato",
  email: "Email",
  request_id: "Richiesta",
  broker_id: "Broker",
  commission_id: "Commissione",
  insurer: "Assicuratore",
  category: "Categoria",
  gross_commission: "Commissione lorda",
  effective_from: "Valida da",
  atlas_percentage: "Percentuale ATLAS",
  broker_percentage: "Percentuale broker",
  amount: "Importo",
  reason: "Motivazione",
  adjustment_type: "Tipo rettifica",
  application_id: "Candidatura",
};

const val = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const req = (formData: FormData, key: string) => {
  const result = val(formData, key);
  if (!result) {
    throw new OperationsInputError(`Compila il campo "${fieldLabels[key] ?? key}".`);
  }
  return result;
};

function revalidateControlCenter() {
  revalidatePath("/control-center");
  revalidatePath("/control-center/partners");
  revalidatePath("/control-center/consultations");
  revalidatePath("/control-center/commissions");
  revalidatePath("/control-center/contracts");
  revalidatePath("/control-center/users");
  revalidatePath("/control-center/audit");
  revalidatePath("/admin");
}

export async function assignConsultationAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { error } = await supabase.rpc("assign_consultation", {
    p_consultation_request_id: req(formData, "request_id"),
    p_broker_id: val(formData, "broker_id") || null,
    p_reason: val(formData, "reason") || null,
  });
  if (error) throw new OperationsInputError("Assegnazione non applicata. Ricarica e riprova.");
  revalidateControlCenter();
}

export async function createBrokerAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const authUserId = req(formData, "auth_user_id");
  if (!UUID_PATTERN.test(authUserId)) {
    throw new OperationsInputError(
      "L'identificativo account non è valido. Copia l'UUID dell'utente da Supabase Authentication."
    );
  }
  const email = req(formData, "email");
  const { error } = await supabase.from("brokers").insert({
    auth_user_id: authUserId,
    display_name: req(formData, "display_name"),
    legal_name: val(formData, "legal_name") || null,
    organization_name: val(formData, "organization_name") || null,
    email,
    phone: val(formData, "phone") || null,
    active: val(formData, "active") !== "inactive",
  });
  if (error) {
    throw new OperationsInputError(
      error.code === "23505"
        ? "Esiste già un broker con questa email o questo account."
        : "Broker non registrato. Verifica i dati inseriti."
    );
  }
  const { error: roleError } = await supabase.rpc("set_user_role", {
    p_user_id: authUserId,
    p_role: "broker",
  });
  if (roleError) {
    throw new OperationsInputError("Broker creato, ma il ruolo non è stato assegnato. Riprova.");
  }
  revalidateControlCenter();
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
  if (error) {
    throw new OperationsInputError(
      "Accordo non salvato. Le percentuali ATLAS e broker devono totalizzare 100."
    );
  }
  revalidateControlCenter();
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
    p_commission_rate: val(formData, "commission_rate")
      ? Number(val(formData, "commission_rate"))
      : null,
    p_earned_at: val(formData, "earned_at")
      ? new Date(val(formData, "earned_at")).toISOString()
      : null,
    p_status: val(formData, "status") || "expected",
    p_source: "manual",
    p_external_reference: val(formData, "external_reference") || "",
  });
  if (error) {
    throw new OperationsInputError(
      "Commissione non registrata. Serve un accordo commissionale valido alla data di maturazione."
    );
  }
  revalidateControlCenter();
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
  if (error) {
    throw new OperationsInputError(
      "Rettifica non registrata. Un clawback richiede un importo negativo entro il lordo già attribuito."
    );
  }
  revalidateControlCenter();
}

export async function reviewPartnerApplicationAction(formData: FormData) {
  await requireOperationsRole(["admin"]);
  const decision = req(formData, "decision") as
    | "approve"
    | "reject"
    | "under_review"
    | "suspend"
    | "reactivate";
  if (!["approve", "reject", "under_review", "suspend", "reactivate"].includes(decision)) {
    throw new OperationsInputError("Decisione non valida.");
  }
  await reviewPartnerApplication({
    applicationId: req(formData, "application_id"),
    decision,
    adminNotes: val(formData, "admin_notes") || undefined,
    rejectionReason: val(formData, "rejection_reason") || undefined,
  });
  revalidateControlCenter();
}

export async function setBrokerActiveAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const brokerId = req(formData, "broker_id");
  const active = val(formData, "active") === "true";
  const { data: broker, error: brokerError } = await supabase
    .from("brokers")
    .select("id, auth_user_id, active")
    .eq("id", brokerId)
    .maybeSingle();
  if (brokerError || !broker) {
    throw new OperationsInputError("Partner non trovato.");
  }
  const { error } = await supabase.from("brokers").update({ active }).eq("id", brokerId);
  if (error) throw new OperationsInputError("Stato partner non aggiornato.");

  if (broker.auth_user_id) {
    if (active) {
      const { error: roleError } = await supabase.rpc("set_user_role", {
        p_user_id: broker.auth_user_id,
        p_role: "broker",
      });
      if (roleError) {
        throw new OperationsInputError("Partner riattivato, ma il ruolo broker non è stato ripristinato.");
      }
    } else {
      const { error: roleError } = await supabase.rpc("set_user_role", {
        p_user_id: broker.auth_user_id,
        p_role: "consumer",
      });
      if (roleError) {
        throw new OperationsInputError("Partner sospeso, ma il ruolo non è stato revocato.");
      }
    }
  }
  revalidateControlCenter();
}
