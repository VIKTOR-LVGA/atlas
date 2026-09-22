/**
 * Friendly / operational status mapping for consultations, appointments, offers.
 * Compatibility layer — does not rename historical DB values.
 */

/** Canonical DB statuses (do not invent values that violate consultation_requests_status_check). */
export function consumerConsultationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Richiesta inviata",
    assigned: "Consulente assegnato",
    contacted: "In contatto",
    consultation_scheduled: "Appuntamento",
    in_review: "In revisione",
    quoted: "Offerta ricevuta",
    won: "Conclusa",
    lost: "Chiusa",
    completed: "Conclusa",
    cancelled: "Annullata",
  };
  return map[status] ?? status;
}

export function brokerConsultationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Nuova",
    assigned: "Da prendere in carico",
    contacted: "Contatto",
    consultation_scheduled: "Appuntamento",
    in_review: "Analisi",
    quoted: "Offerta",
    won: "Chiusa",
    lost: "Chiusa",
    completed: "Chiusa",
    cancelled: "Chiusa",
  };
  return map[status] ?? status;
}

export function appointmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    scheduled: "Confermato",
    proposed: "Proposto",
    counter_proposed: "Controproposta",
    confirmed: "Confermato",
    completed: "Completato",
    cancelled: "Annullato",
    no_show: "No-show",
  };
  return map[status] ?? status;
}

export function offerStatusLabel(status: string, audience: "consumer" | "broker" = "consumer"): string {
  const consumer: Record<string, string> = {
    draft: "In preparazione",
    proposed: "Nuova offerta",
    sent: "Nuova offerta",
    viewed: "Visualizzata",
    clarification_requested: "Hai chiesto chiarimenti",
    interested: "Hai espresso interesse",
    declined: "Non interessato",
    accepted: "Accettata",
    rejected: "Rifiutata",
    expired: "Scaduta",
    converted: "Convertita in contratto",
  };
  const broker: Record<string, string> = {
    draft: "Bozza",
    proposed: "Inviata",
    sent: "Inviata",
    viewed: "Visualizzata",
    clarification_requested: "Chiarimento richiesto",
    interested: "Cliente interessato",
    declined: "Cliente non interessato",
    accepted: "Accettata",
    rejected: "Rifiutata",
    expired: "Scaduta",
    converted: "Convertita",
  };
  return (audience === "broker" ? broker : consumer)[status] ?? status;
}

export function reviewReasonLabel(code: string): string {
  const map: Record<string, string> = {
    reduce_premium: "Voglio ridurre il premio",
    verify_coverages: "Voglio verificare le coperture",
    change_insurer: "Voglio cambiare compagnia",
    check_adequacy: "Voglio capire se sono assicurato correttamente",
    other: "Altro",
  };
  return map[code] ?? code;
}

export type NextAction = { label: string; href?: string };

export function consumerNextAction(input: {
  status: string;
  hasUnreadMessages?: boolean;
  appointmentStatus?: string | null;
  offerStatus?: string | null;
  consultationId: string;
}): NextAction {
  const base = `/consultations/${input.consultationId}`;
  if (input.hasUnreadMessages) return { label: "Rispondi al broker", href: `${base}?tab=messages` };
  if (input.appointmentStatus === "proposed" || input.appointmentStatus === "counter_proposed") {
    return { label: "Conferma appuntamento", href: `${base}?tab=appointment` };
  }
  if (input.offerStatus === "sent" || input.offerStatus === "proposed" || input.offerStatus === "viewed") {
    return { label: "Leggi offerta", href: `${base}?tab=offers` };
  }
  if (input.status === "quoted") {
    return { label: "Prendi una decisione", href: `${base}?tab=offers` };
  }
  if (["won", "lost", "completed", "cancelled"].includes(input.status)) {
    return { label: "Pratica conclusa", href: base };
  }
  return { label: "Segui la pratica", href: base };
}

export function brokerNextAction(input: {
  status: string;
  acceptanceStatus?: string | null;
  hasUnreadMessages?: boolean;
  appointmentNeedsResponse?: boolean;
  hasDraftOffer?: boolean;
  clarificationRequested?: boolean;
  requestId: string;
}): NextAction {
  const base = `/broker/requests/${input.requestId}`;
  if (input.acceptanceStatus === "pending" || input.status === "assigned") {
    return { label: "Prendi in carico", href: base };
  }
  if (input.hasUnreadMessages) return { label: "Rispondi al messaggio", href: `${base}?tab=messages` };
  if (input.appointmentNeedsResponse) return { label: "Rispondi all'appuntamento", href: `${base}?tab=appointment` };
  if (input.clarificationRequested) return { label: "Rispondi al chiarimento", href: `${base}?tab=offers` };
  if (input.hasDraftOffer) return { label: "Completa bozza offerta", href: `${base}?tab=offers` };
  if (["contacted", "in_review"].includes(input.status)) {
    return { label: "Proponi appuntamento", href: `${base}?tab=appointment` };
  }
  if (input.status === "consultation_scheduled") {
    return { label: "Prepara offerta", href: `${base}?tab=offers` };
  }
  return { label: "Apri pratica", href: base };
}
