"use server";

import { assertBrokerPortalEnabled } from "@/lib/broker-portal";
import { searchPartnerWorkspace } from "@/lib/broker-operations";

export async function searchPartnerAction(query: string) {
  assertBrokerPortalEnabled();
  try {
    return await searchPartnerWorkspace(query);
  } catch {
    return { clients: [], leads: [], contracts: [], offers: [] };
  }
}
