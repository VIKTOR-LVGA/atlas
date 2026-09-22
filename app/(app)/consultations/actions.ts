"use server";

import { revalidatePath } from "next/cache";
import {
  CollaborationError,
  consumerDecideOffer,
  consumerRespondToAppointment,
  markConsumerMessagesRead,
  sendConsumerConsultationMessage,
} from "@/lib/consumer-collaboration";

function fail(error: unknown) {
  return {
    ok: false as const,
    message: error instanceof CollaborationError ? error.message : "Operazione non riuscita.",
  };
}

export async function sendConsumerMessageAction(consultationId: string, body: string) {
  try {
    await sendConsumerConsultationMessage(consultationId, body);
    revalidatePath(`/consultations/${consultationId}`);
    return { ok: true as const, message: "Messaggio inviato." };
  } catch (error) {
    return fail(error);
  }
}

export async function markMessagesReadAction(consultationId: string) {
  try {
    await markConsumerMessagesRead(consultationId);
    revalidatePath(`/consultations/${consultationId}`);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function consumerAppointmentAction(input: {
  consultationId: string;
  appointmentId: string;
  action: "confirm" | "decline" | "counter";
  scheduledAt?: string;
  note?: string;
}) {
  try {
    await consumerRespondToAppointment(input);
    revalidatePath(`/consultations/${input.consultationId}`);
    return { ok: true as const, message: "Risposta registrata." };
  } catch (error) {
    return fail(error);
  }
}

export async function consumerOfferDecisionAction(input: {
  consultationId: string;
  offerId: string;
  decision: "interested" | "clarification" | "declined" | "request_appointment";
  note?: string;
}) {
  try {
    await consumerDecideOffer(input);
    revalidatePath(`/consultations/${input.consultationId}`);
    revalidatePath(`/consultations/${input.consultationId}/offers/${input.offerId}`);
    return { ok: true as const, message: "Risposta inviata al consulente." };
  } catch (error) {
    return fail(error);
  }
}
