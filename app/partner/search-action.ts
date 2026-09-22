"use server";

import { searchPartnerWorkspace } from "@/lib/broker-operations";

export async function searchPartnerAction(query: string) {
  try {
    return await searchPartnerWorkspace(query);
  } catch {
    return { clients: [], leads: [], contracts: [], offers: [] };
  }
}
