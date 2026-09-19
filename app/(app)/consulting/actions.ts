"use server";

import { revalidatePath } from "next/cache";
import {
  ConsultationDataError,
  createConsultationRequest,
  type ConsultationRequestInput,
} from "@/lib/consultations";

export async function createConsultationRequestAction(input: ConsultationRequestInput) {
  try {
    const data = await createConsultationRequest(input);
    revalidatePath("/consulting");
    return { ok: true, message: "Richiesta ricevuta. La ritroverai qui anche al prossimo accesso.", data };
  } catch (error) {
    return { ok: false, message: error instanceof ConsultationDataError ? error.message : "Richiesta non inviata.", data: null };
  }
}
