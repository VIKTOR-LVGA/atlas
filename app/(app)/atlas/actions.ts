"use server";

import { revalidatePath } from "next/cache";
import {
  dismissAttentionItem,
  resolveAttentionItem,
} from "@/lib/insurance-os/action-center";
import { answerAskAtlas, persistAskExchange, type AskAtlasResult } from "@/lib/insurance-os/ask-atlas";
import { runAnnualCheckup, type CheckupResult } from "@/lib/insurance-os/checkup";
import {
  buildCoverageMap,
  listCurrentUserPolicyCoverages,
} from "@/lib/insurance-os/coverage-map";
import { listRecentPolicyChanges } from "@/lib/insurance-os/policy-diff";
import { trackProductEvent } from "@/lib/insurance-os/telemetry";
import { runWhatIfAndPersist } from "@/lib/insurance-os/what-if";
import type { WhatIfResult } from "@/lib/insurance-os/what-if";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getCurrentUserPolicies } from "@/lib/policies";

export type AtlasActionResult<T> = {
  ok: boolean;
  error?: string;
  data?: T;
};

const GENERIC_ERROR = "Operazione non riuscita. Riprova tra poco.";

function toMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : GENERIC_ERROR;
}

export async function askAtlasAction(
  question: string
): Promise<AtlasActionResult<AskAtlasResult>> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { ok: false, error: "Scrivi una domanda sulla tua situazione assicurativa." };
  }

  try {
    const [policies, documents, coverages] = await Promise.all([
      getCurrentUserPolicies(),
      getCurrentUserDocuments(),
      listCurrentUserPolicyCoverages(),
    ]);

    const result = await answerAskAtlas(trimmed, { policies, documents, coverages });
    await persistAskExchange({ mode: "ask", question: trimmed, result });
    await trackProductEvent("ask_atlas_question", {
      route: "/atlas/ask",
      policies: policies.length,
      verification: result.verificationStatus,
    });

    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function whatIfAction(
  scenario: string
): Promise<AtlasActionResult<WhatIfResult>> {
  const trimmed = scenario.trim();
  if (!trimmed) {
    return { ok: false, error: "Descrivi lo scenario che vuoi analizzare." };
  }

  try {
    const [policies, documents, coverages] = await Promise.all([
      getCurrentUserPolicies(),
      getCurrentUserDocuments(),
      listCurrentUserPolicyCoverages(),
    ]);

    const { result } = await runWhatIfAndPersist({
      scenario: trimmed,
      policies,
      documents,
      coverages,
    });

    await trackProductEvent("what_if_started", {
      route: "/atlas/what-if",
      policies: policies.length,
      verification: result.verificationStatus,
    });

    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function runCheckupAction(): Promise<AtlasActionResult<CheckupResult>> {
  try {
    const [policies, documents, coverages, changes] = await Promise.all([
      getCurrentUserPolicies(),
      getCurrentUserDocuments(),
      listCurrentUserPolicyCoverages(),
      listRecentPolicyChanges(20),
    ]);

    if (policies.length === 0) {
      return {
        ok: false,
        error: "Carica almeno una polizza prima di eseguire il check-up.",
      };
    }

    await trackProductEvent("checkup_started", { route: "/atlas/checkup" });

    const coverageMap = buildCoverageMap({ policies, coverages });
    const checkup = await runAnnualCheckup({
      policies,
      documents,
      coverageMap,
      changes,
    });

    await trackProductEvent("checkup_completed", {
      route: "/atlas/checkup",
      completeness: checkup.dataCompletenessPercent,
    });

    revalidatePath("/atlas/checkup");
    revalidatePath("/atlas");
    revalidatePath("/dashboard");

    return { ok: true, data: checkup };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function dismissAttentionAction(
  id: string
): Promise<AtlasActionResult<{ id: string }>> {
  try {
    const dismissed = await dismissAttentionItem(id);
    if (!dismissed) {
      return { ok: false, error: "Elemento non trovato." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/activity");
    return { ok: true, data: { id: dismissed } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function resolveAttentionAction(
  id: string
): Promise<AtlasActionResult<{ id: string }>> {
  try {
    const resolved = await resolveAttentionItem(id);
    if (!resolved) {
      return { ok: false, error: "Elemento non trovato." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/activity");
    return { ok: true, data: { id: resolved } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
