"use server";

import { revalidatePath } from "next/cache";
import { dismissOpportunity, markOpportunitySeen, OpportunityDataError } from "@/lib/persisted-opportunities";

export async function markOpportunitySeenAction(id: string) {
  try {
    const data = await markOpportunitySeen(id);
    revalidatePath("/dashboard");
    return { ok: true, message: "Opportunita letta.", data };
  } catch (error) {
    return { ok: false, message: error instanceof OpportunityDataError ? error.message : "Operazione non riuscita.", data: null };
  }
}

export async function dismissOpportunityAction(id: string) {
  try {
    const data = await dismissOpportunity(id);
    revalidatePath("/dashboard");
    return { ok: true, message: "Opportunita archiviata.", data };
  } catch (error) {
    return { ok: false, message: error instanceof OpportunityDataError ? error.message : "Operazione non riuscita.", data: null };
  }
}
