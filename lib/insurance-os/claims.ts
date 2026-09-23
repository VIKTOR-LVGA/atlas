import "server-only";

import { recordTimelineEvent } from "@/lib/insurance-os/timeline";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserPolicy } from "@/lib/types";

export type ClaimStatus =
  | "draft"
  | "ready"
  | "submitted_externally"
  | "in_progress"
  | "closed";

export type ClaimCategory =
  | "car_accident"
  | "home_damage"
  | "theft"
  | "travel"
  | "baggage"
  | "liability"
  | "health_injury"
  | "legal"
  | "other";

export type ClaimChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
};

export type InsuranceClaim = {
  id: string;
  status: ClaimStatus;
  category: ClaimCategory;
  title: string;
  description: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  estimatedAmount: number | null;
  currency: string;
  peopleInvolved: string | null;
  notes: string | null;
  checklist: ClaimChecklistItem[];
  relatedPolicyIds: string[];
  matchingRationale: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type ClaimFile = {
  id: string;
  claimId: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  kind: string;
  createdAt: string;
};

const CATEGORY_LABELS: Record<ClaimCategory, string> = {
  car_accident: "Incidente auto",
  home_damage: "Danno casa",
  theft: "Furto",
  travel: "Viaggio",
  baggage: "Bagaglio",
  liability: "Responsabilità civile",
  health_injury: "Salute / infortunio",
  legal: "Protezione giuridica",
  other: "Altro",
};

export function claimCategoryLabel(category: ClaimCategory) {
  return CATEGORY_LABELS[category];
}

export function buildClaimChecklist(category: ClaimCategory): ClaimChecklistItem[] {
  const base: ClaimChecklistItem[] = [
    { id: "event_date", label: "Data dell’evento", required: true, done: false },
    { id: "event_place", label: "Luogo", required: true, done: false },
    { id: "description", label: "Descrizione", required: true, done: false },
    { id: "photos", label: "Foto", required: false, done: false },
  ];

  const extra: Partial<Record<ClaimCategory, ClaimChecklistItem[]>> = {
    car_accident: [
      { id: "police", label: "Rapporto / constatazione", required: false, done: false },
      { id: "other_party", label: "Dati controparte", required: false, done: false },
    ],
    home_damage: [
      { id: "invoice", label: "Preventivo o fattura", required: false, done: false },
    ],
    theft: [
      { id: "police", label: "Denuncia", required: true, done: false },
      { id: "invoice", label: "Prova d’acquisto", required: false, done: false },
    ],
    travel: [
      { id: "booking", label: "Prenotazione / biglietti", required: false, done: false },
    ],
    baggage: [
      { id: "airline", label: "Rapporto vettore", required: false, done: false },
    ],
    liability: [
      { id: "third_party", label: "Danni a terzi descritti", required: true, done: false },
    ],
    health_injury: [
      { id: "medical", label: "Documentazione medica", required: false, done: false },
    ],
    legal: [
      { id: "correspondence", label: "Corrispondenza", required: false, done: false },
    ],
  };

  return [...base, ...(extra[category] ?? [])];
}

const CATEGORY_POLICY_TYPES: Record<ClaimCategory, string[]> = {
  car_accident: ["car"],
  home_damage: ["household", "building"],
  theft: ["household", "travel"],
  travel: ["travel"],
  baggage: ["travel", "household"],
  liability: ["liability"],
  health_injury: ["health"],
  legal: ["legal"],
  other: [],
};

export function matchPoliciesForClaim(
  category: ClaimCategory,
  description: string,
  policies: UserPolicy[]
) {
  const types = CATEGORY_POLICY_TYPES[category];
  const matched = policies.filter((p) =>
    types.length === 0 ? true : types.includes(p.policyType)
  );
  const rationale = {
    category,
    matchedPolicyTypes: types,
    note: "Polizze potenzialmente pertinenti in base alla categoria. Non è una conferma di copertura.",
    descriptionTokens: description.slice(0, 80),
  };
  return {
    relatedPolicyIds: matched.map((p) => p.id),
    matchingRationale: rationale,
    labels: matched.map(
      (p) => `${p.provider} · ${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)}`
    ),
  };
}

function mapClaim(row: Record<string, unknown>): InsuranceClaim {
  return {
    id: String(row.id),
    status: row.status as ClaimStatus,
    category: row.category as ClaimCategory,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    eventDate: row.event_date ? String(row.event_date) : null,
    eventLocation: row.event_location ? String(row.event_location) : null,
    estimatedAmount: row.estimated_amount == null ? null : Number(row.estimated_amount),
    currency: String(row.currency ?? "CHF"),
    peopleInvolved: row.people_involved ? String(row.people_involved) : null,
    notes: row.notes ? String(row.notes) : null,
    checklist: (row.checklist as ClaimChecklistItem[]) ?? [],
    relatedPolicyIds: (row.related_policy_ids as string[]) ?? [],
    matchingRationale: (row.matching_rationale as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    closedAt: row.closed_at ? String(row.closed_at) : null,
  };
}

export async function createClaim(input: {
  category: ClaimCategory;
  description: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  estimatedAmount?: number | null;
  peopleInvolved?: string | null;
  policies: UserPolicy[];
}): Promise<InsuranceClaim> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Accedi di nuovo per continuare.");

  const match = matchPoliciesForClaim(input.category, input.description, input.policies);
  const checklist = buildClaimChecklist(input.category).map((item) => {
    if (item.id === "event_date" && input.eventDate) return { ...item, done: true };
    if (item.id === "event_place" && input.eventLocation) return { ...item, done: true };
    if (item.id === "description" && input.description.trim()) return { ...item, done: true };
    return item;
  });

  const title = `${CATEGORY_LABELS[input.category]} · ${new Date().toLocaleDateString("it-CH")}`;

  const { data, error } = await supabase
    .from("insurance_claims")
    .insert({
      user_id: user.id,
      status: "draft",
      category: input.category,
      title,
      description: input.description.slice(0, 8000),
      event_date: input.eventDate || null,
      event_location: input.eventLocation?.slice(0, 240) || null,
      estimated_amount: input.estimatedAmount ?? null,
      people_involved: input.peopleInvolved?.slice(0, 1000) || null,
      checklist,
      related_policy_ids: match.relatedPolicyIds,
      matching_rationale: match.matchingRationale,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await recordTimelineEvent({
    eventType: "claim_created",
    title: "Dossier sinistro creato",
    description: title,
    entityType: "claim",
    entityId: data.id,
    claimId: data.id,
    idempotencyKey: `claim_created:${data.id}`,
  });

  return mapClaim(data as Record<string, unknown>);
}

export async function listCurrentUserClaims(): Promise<InsuranceClaim[]> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("insurance_claims")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => mapClaim(row as Record<string, unknown>));
}

export async function getCurrentUserClaim(id: string): Promise<InsuranceClaim | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("insurance_claims")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? mapClaim(data as Record<string, unknown>) : null;
}

export async function updateClaimChecklist(
  claimId: string,
  checklist: ClaimChecklistItem[]
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const requiredDone = checklist.filter((c) => c.required).every((c) => c.done);
  const status: ClaimStatus = requiredDone ? "ready" : "draft";

  const { data } = await supabase
    .from("insurance_claims")
    .update({ checklist, status })
    .eq("id", claimId)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  return data ? mapClaim(data as Record<string, unknown>) : null;
}

export async function markClaimSubmittedExternally(claimId: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("insurance_claims")
    .update({
      status: "submitted_externally",
      submitted_externally_at: new Date().toISOString(),
    })
    .eq("id", claimId)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();
  return data ? mapClaim(data as Record<string, unknown>) : null;
}

export async function closeClaim(claimId: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("insurance_claims")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", claimId)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (data) {
    await recordTimelineEvent({
      eventType: "claim_closed",
      title: "Dossier sinistro chiuso",
      entityType: "claim",
      entityId: claimId,
      claimId,
      idempotencyKey: `claim_closed:${claimId}`,
    });
  }

  return data ? mapClaim(data as Record<string, unknown>) : null;
}

export async function uploadClaimFile(input: {
  claimId: string;
  file: File;
  kind: ClaimFile["kind"];
}): Promise<ClaimFile> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Accedi di nuovo per continuare.");

  const claim = await getCurrentUserClaim(input.claimId);
  if (!claim) throw new Error("Dossier non trovato.");

  const safeName = input.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `${user.id}/${input.claimId}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("claim-documents")
    .upload(path, buffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("insurance_claim_files")
    .insert({
      user_id: user.id,
      claim_id: input.claimId,
      file_name: input.file.name.slice(0, 240),
      file_path: path,
      file_size: input.file.size,
      mime_type: input.file.type || null,
      kind: input.kind,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: String(data.id),
    claimId: String(data.claim_id),
    fileName: String(data.file_name),
    filePath: String(data.file_path),
    fileSize: data.file_size == null ? null : Number(data.file_size),
    mimeType: data.mime_type ? String(data.mime_type) : null,
    kind: String(data.kind),
    createdAt: String(data.created_at),
  };
}

export async function listClaimFiles(claimId: string): Promise<ClaimFile[]> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("insurance_claim_files")
    .select("*")
    .eq("user_id", user.id)
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: String(row.id),
    claimId: String(row.claim_id),
    fileName: String(row.file_name),
    filePath: String(row.file_path),
    fileSize: row.file_size == null ? null : Number(row.file_size),
    mimeType: row.mime_type ? String(row.mime_type) : null,
    kind: String(row.kind),
    createdAt: String(row.created_at),
  }));
}

export async function createClaimFileSignedUrl(filePath: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!filePath.startsWith(`${user.id}/`)) return null;

  const { data, error } = await supabase.storage
    .from("claim-documents")
    .createSignedUrl(filePath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

export function buildClaimDossierText(claim: InsuranceClaim, files: ClaimFile[]) {
  return [
    "ATLAS — Dossier sinistro (preparazione)",
    "Questo dossier NON è stato inviato automaticamente alla compagnia.",
    "",
    `Titolo: ${claim.title}`,
    `Stato: ${claim.status}`,
    `Categoria: ${CATEGORY_LABELS[claim.category]}`,
    `Data evento: ${claim.eventDate ?? "—"}`,
    `Luogo: ${claim.eventLocation ?? "—"}`,
    `Importo stimato: ${claim.estimatedAmount ?? "—"} ${claim.currency}`,
    "",
    "Descrizione:",
    claim.description ?? "—",
    "",
    "Checklist:",
    ...claim.checklist.map((c) => `- [${c.done ? "x" : " "}] ${c.label}`),
    "",
    "Polizze potenzialmente correlate:",
    ...claim.relatedPolicyIds.map((id) => `- ${id}`),
    "",
    "Allegati:",
    ...files.map((f) => `- ${f.fileName} (${f.kind})`),
    "",
    "Note:",
    claim.notes ?? "—",
  ].join("\n");
}
