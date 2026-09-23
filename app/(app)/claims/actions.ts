"use server";

import { revalidatePath } from "next/cache";
import {
  closeClaim,
  createClaim,
  createClaimFileSignedUrl,
  markClaimSubmittedExternally,
  updateClaimChecklist,
  uploadClaimFile,
} from "@/lib/insurance-os/claims";
import type { ClaimCategory } from "@/lib/insurance-os/claims-client";
import type {
  ClaimChecklistItem,
  ClaimFileView,
  InsuranceClaimView,
} from "@/lib/insurance-os/claims-view";
import { trackProductEvent } from "@/lib/insurance-os/telemetry";
import { getCurrentUserPolicies } from "@/lib/policies";

export type ClaimActionResult<T> = {
  ok: boolean;
  error?: string;
  data?: T;
};

const GENERIC_ERROR = "Operazione non riuscita. Riprova tra poco.";
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const CLAIM_CATEGORIES: ClaimCategory[] = [
  "car_accident",
  "home_damage",
  "theft",
  "travel",
  "baggage",
  "liability",
  "health_injury",
  "legal",
  "other",
];

function toMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : GENERIC_ERROR;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const normalized = Number.parseFloat(raw.replace(/['\s]/g, "").replace(",", "."));
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : null;
}

function revalidateClaims(claimId?: string) {
  revalidatePath("/claims");
  revalidatePath("/activity");
  revalidatePath("/dashboard");
  if (claimId) revalidatePath(`/claims/${claimId}`);
}

export async function createClaimAction(
  formData: FormData
): Promise<ClaimActionResult<{ id: string }>> {
  try {
    const rawCategory = readString(formData, "category");
    const category = CLAIM_CATEGORIES.find((c) => c === rawCategory);
    if (!category) {
      return { ok: false, error: "Scegli il tipo di evento." };
    }

    const description = readString(formData, "description");
    if (description.length < 10) {
      return {
        ok: false,
        error: "Descrivi l’evento con almeno una frase completa.",
      };
    }

    const policies = await getCurrentUserPolicies();

    const claim = await createClaim({
      category,
      description,
      eventDate: readString(formData, "eventDate") || null,
      eventLocation: readString(formData, "eventLocation") || null,
      estimatedAmount: parseAmount(readString(formData, "estimatedAmount")),
      peopleInvolved: readString(formData, "peopleInvolved") || null,
      policies,
    });

    await trackProductEvent("claim_started", {
      route: "/claims/new",
      category,
      relatedPolicies: claim.relatedPolicyIds.length,
    });

    revalidateClaims(claim.id);
    return { ok: true, data: { id: claim.id } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function updateChecklistAction(
  claimId: string,
  checklist: ClaimChecklistItem[]
): Promise<ClaimActionResult<InsuranceClaimView>> {
  try {
    const safe = checklist.map((item) => ({
      id: String(item.id),
      label: String(item.label),
      required: Boolean(item.required),
      done: Boolean(item.done),
    }));

    const claim = await updateClaimChecklist(claimId, safe);
    if (!claim) {
      return { ok: false, error: "Dossier non trovato." };
    }

    revalidateClaims(claimId);
    return { ok: true, data: claim };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function uploadClaimFileAction(
  formData: FormData
): Promise<ClaimActionResult<ClaimFileView>> {
  try {
    const claimId = readString(formData, "claimId");
    if (!claimId) {
      return { ok: false, error: "Dossier non valido." };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Seleziona un file da allegare." };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: "Il file supera i 15 MB." };
    }

    const kind = readString(formData, "kind") || "other";
    const uploaded = await uploadClaimFile({ claimId, file, kind });

    revalidateClaims(claimId);
    return { ok: true, data: uploaded };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function claimFileUrlAction(
  filePath: string
): Promise<ClaimActionResult<{ url: string }>> {
  try {
    const url = await createClaimFileSignedUrl(filePath);
    if (!url) {
      return { ok: false, error: "Allegato non disponibile." };
    }
    return { ok: true, data: { url } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function markSubmittedExternallyAction(
  claimId: string
): Promise<ClaimActionResult<InsuranceClaimView>> {
  try {
    const claim = await markClaimSubmittedExternally(claimId);
    if (!claim) {
      return { ok: false, error: "Dossier non trovato." };
    }
    revalidateClaims(claimId);
    return { ok: true, data: claim };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function closeClaimAction(
  claimId: string
): Promise<ClaimActionResult<InsuranceClaimView>> {
  try {
    const claim = await closeClaim(claimId);
    if (!claim) {
      return { ok: false, error: "Dossier non trovato." };
    }
    await trackProductEvent("claim_completed", {
      route: "/claims",
      category: claim.category,
    });
    revalidateClaims(claimId);
    return { ok: true, data: claim };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
